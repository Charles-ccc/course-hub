import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; role: string; orgId?: string }) {
    const { role, sub, orgId } = payload;

    // 平台后台管理员
    if (["admin", "ops", "finance", "risk"].includes(role)) {
      return { id: sub, role, isAdmin: true };
    }

    // 机构账号
    if (role === "org") {
      const org = await this.prisma.org.findUnique({
        where: { id: orgId || sub },
      });
      if (!org) throw new UnauthorizedException();
      return { id: sub, role, orgId: org.id, orgName: org.name };
    }

    if (role === "staff") {
      const staff = await this.prisma.staff.findUnique({ where: { id: sub } });
      if (!staff) throw new UnauthorizedException();
      return { ...staff, role };
    }

    // 学员 / 业务员
    const student = await this.prisma.student.findUnique({
      where: { id: sub },
    });
    if (!student) throw new UnauthorizedException();
    return { ...student, role };
  }
}
