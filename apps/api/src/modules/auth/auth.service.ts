import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import axios from "axios";
// alipay-sdk 为可选依赖：仅在生产分支真正调用时按需引入，
// 避免本地无该依赖时影响 dev 模式启动
type AlipaySdkCtor = new (opts: any) => {
  exec: (
    method: string,
    params: Record<string, any>,
  ) => Promise<{
    code: string;
    msg: string;
    userId?: string;
    alipayUserId?: string;
    sub_msg?: string;
  }>;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async wechatLogin(dto: {
    code: string;
    appType: "student" | "staff";
    referrerStaffId?: string;
    referrerStudentId?: string;
  }) {
    const { code, appType } = dto;
    const appId =
      appType === "student"
        ? this.config.get("WECHAT_STUDENT_APP_ID")
        : this.config.get("WECHAT_STAFF_APP_ID");
    const appSecret =
      appType === "student"
        ? this.config.get("WECHAT_STUDENT_APP_SECRET")
        : this.config.get("WECHAT_STAFF_APP_SECRET");

    let openid: string;

    const isDevMode = !appId || appId.startsWith("YOUR_") || appId === "";

    if (isDevMode) {
      // 开发模式：跳过真实微信接口，用 code 派生一个稳定的 openid
      openid = `dev_${appType}_${code.slice(0, 20)}`;
    } else {
      const { data } = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`,
      );
      if (data.errcode)
        throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
      openid = data.openid;
    }

    if (appType === "staff") {
      return this.staffLoginByOpenid({ provider: "weixin", openid, isDevMode });
    }
    return this.studentLoginByOpenid({
      provider: "weixin",
      openid,
      referrerStaffId: dto.referrerStaffId,
      referrerStudentId: dto.referrerStudentId,
    });
  }

  async alipayLogin(dto: {
    authCode: string;
    appType: "student" | "staff";
    referrerStaffId?: string;
    referrerStudentId?: string;
  }) {
    const appId =
      dto.appType === "student"
        ? this.config.get("ALIPAY_STUDENT_APP_ID")
        : this.config.get("ALIPAY_STAFF_APP_ID");

    const isDevMode = !appId || appId.startsWith("YOUR_") || appId === "";

    let alipayUserId: string;
    if (isDevMode) {
      alipayUserId = `dev_alipay_${dto.appType}_${dto.authCode.slice(0, 20)}`;
    } else {
      alipayUserId = await this.exchangeAlipayUserId(dto.authCode, appId);
    }

    if (dto.appType === "staff") {
      return this.staffLoginByOpenid({
        provider: "alipay",
        openid: alipayUserId,
        isDevMode,
      });
    }
    return this.studentLoginByOpenid({
      provider: "alipay",
      openid: alipayUserId,
      referrerStaffId: dto.referrerStaffId,
      referrerStudentId: dto.referrerStudentId,
    });
  }

  // ---------- 学员登录：找不到自动建档 ----------
  private async studentLoginByOpenid(args: {
    provider: "weixin" | "alipay";
    openid: string;
    referrerStaffId?: string;
    referrerStudentId?: string;
  }) {
    const whereKey =
      args.provider === "weixin" ? "openidWeixin" : "openidAlipay";

    let student = await this.prisma.student.findUnique({
      where: { [whereKey]: args.openid } as any,
    });

    if (!student) {
      student = await this.prisma.student.create({
        data: {
          [whereKey]: args.openid,
          phone: "",
          realname: "",
          idNoHash: "",
          idNoEncrypted: "",
          referrerStaffId: args.referrerStaffId || null,
          referrerStudentId: args.referrerStudentId || null,
        } as any,
      });
    }

    const token = this.jwtService.sign({
      sub: student.id,
      role: "student",
    });
    return { token, student, isNew: !student.realnameVerified };
  }

  // ---------- 业务员登录：必须预录入 ----------
  private async staffLoginByOpenid(args: {
    provider: "weixin" | "alipay";
    openid: string;
    isDevMode: boolean;
  }) {
    const whereKey =
      args.provider === "weixin" ? "openidWeixin" : "openidAlipay";

    let staff = await this.prisma.staff.findUnique({
      where: { [whereKey]: args.openid } as any,
    });

    if (!staff && args.isDevMode) {
      // dev 模式：自动创建演示 Staff，便于本地调试
      const phone = `DEMO_${Date.now()}`;
      staff = await this.prisma.staff.create({
        data: {
          name: `演示业务员_${args.openid.slice(-6)}`,
          phone,
          contractType: "EMPLOYEE",
          status: "ACTIVE",
          [whereKey]: args.openid,
        } as any,
      });
    }

    if (!staff) {
      throw new UnauthorizedException(
        "该账号尚未开通业务员权限，请联系运营人员",
      );
    }

    if (staff.status === "DISABLED") {
      throw new UnauthorizedException("业务员账号已被禁用");
    }

    const token = this.jwtService.sign({
      sub: staff.id,
      role: "staff",
    });
    return { token, student: staff, isNew: false };
  }

  // ---------- 支付宝 oauth.token ----------
  private async exchangeAlipayUserId(
    authCode: string,
    appId: string,
  ): Promise<string> {
    const privateKey = this.config.get<string>("ALIPAY_PRIVATE_KEY");
    const alipayPublicKey = this.config.get<string>("ALIPAY_PUBLIC_KEY");

    if (!privateKey || !alipayPublicKey) {
      throw new UnauthorizedException(
        "支付宝登录未配置 ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY",
      );
    }

    let AlipaySdk: AlipaySdkCtor;
    try {
      // 运行时加载，避免本地未安装 alipay-sdk 导致 dev 启动失败
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("alipay-sdk");
      AlipaySdk = (mod.default ?? mod) as AlipaySdkCtor;
    } catch {
      throw new UnauthorizedException(
        "缺少依赖 alipay-sdk，请在 apps/api 中执行 pnpm add alipay-sdk",
      );
    }

    const sdk = new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey,
      signType: "RSA2",
      gateway:
        this.config.get<string>("ALIPAY_GATEWAY") ||
        "https://openapi.alipay.com/gateway.do",
    });

    const result = await sdk.exec("alipay.system.oauth.token", {
      grantType: "authorization_code",
      code: authCode,
    });

    if (result.code && result.code !== "10000") {
      throw new UnauthorizedException(
        `支付宝登录失败: ${result.msg} ${result.sub_msg || ""}`,
      );
    }

    const userId = result.userId || result.alipayUserId;
    if (!userId) {
      throw new UnauthorizedException("支付宝登录失败：未返回 userId");
    }
    return userId;
  }

  async registerWithAttribution(dto: any) {
    return this.wechatLogin(dto);
  }
}
