import { Injectable, Logger } from "@nestjs/common";
import { createDecipheriv, randomUUID } from "node:crypto";
import { AlipaySdk } from "alipay-sdk";

@Injectable()
export class AlipayService {
  private readonly logger = new Logger(AlipayService.name);
  private readonly sdk: AlipaySdk | null = null;
  private readonly isProduction = process.env.NODE_ENV === "production";
  private readonly devOpenId =
    process.env.ALIPAY_DEV_OPEN_ID ?? "2088000000000001";
  private readonly devPhone = process.env.ALIPAY_DEV_PHONE ?? "13800138000";

  constructor() {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (appId && privateKey && alipayPublicKey) {
      this.sdk = new AlipaySdk({
        appId,
        privateKey,
        alipayPublicKey,
        signType: "RSA2",
        keyType: "PKCS8",
        camelcase: true,
        gateway: "https://openapi.alipay.com/gateway.do",
      });
      this.logger.log("AlipaySDK initialized");
    } else {
      this.logger.warn(
        "ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY not set — Alipay API calls will throw",
      );
    }
  }

  async getOpenIdByAuthCode(authCode: string): Promise<string> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "student_alipay_login_mocked",
            reason: "sdk_not_configured",
            openId: this.devOpenId,
          }),
        );
        return this.devOpenId;
      }

      throw new Error(
        "AlipaySDK not configured. Set ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY.",
      );
    }

    const result = await this.sdk.exec("alipay.system.oauth.token", {
      grantType: "authorization_code",
      code: authCode,
    });

    const subCode = (result as Record<string, unknown>).subCode;
    if (subCode === "isv.illegal-client-ip" && !this.isProduction) {
      this.logger.warn(
        JSON.stringify({
          event: "student_alipay_login_mocked",
          reason: "illegal_client_ip",
          openId: this.devOpenId,
        }),
      );
      return this.devOpenId;
    }

    const response = result as Record<string, unknown>;
    const openId = (response.openId ?? response.userId) as string | undefined;
    if (!openId) {
      throw new Error(
        `Alipay oauth token response missing openId: ${JSON.stringify(result)}`,
      );
    }

    return openId;
  }

  async initializeCertify(
    studentId: string,
  ): Promise<{ certifyId: string; certifyUrl: string }> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_certify_init_mocked",
            reason: "sdk_not_configured",
            studentId,
          }),
        );
        return { certifyId: `dev-cert-${studentId}`, certifyUrl: "" };
      }
      throw new Error("AlipaySDK not configured");
    }

    // outer_order_no: alphanumeric only, max 32 chars per Alipay spec
    const outerOrderNo = randomUUID().replace(/-/g, "");

    const bizContent = {
      outer_order_no: outerOrderNo,
      biz_code: "SMART_FACE",
      identity_param: {
        identity_type: "CERT_INFO",
        cert_type: "IDENTITY_CARD",
      },
    };
    this.logger.log(
      JSON.stringify({ event: "alipay_certify_init_request", bizContent }),
    );

    let initResult: Record<string, unknown>;
    try {
      initResult = (await this.sdk.exec(
        "alipay.user.certify.open.initialize",
        { bizContent },
      )) as Record<string, unknown>;
    } catch (err) {
      const subCode = (err as Record<string, unknown>)?.subCode as
        | string
        | undefined;
      if (subCode === "isv.illegal-client-ip" && !this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_certify_init_mocked",
            reason: "illegal_client_ip",
            studentId,
          }),
        );
        return { certifyId: `dev-cert-${studentId}`, certifyUrl: "" };
      }
      this.logger.error(
        JSON.stringify({ event: "alipay_certify_init_error", err }),
      );
      throw new Error(`certify initialize failed: ${JSON.stringify(err)}`);
    }

    this.logger.log(
      JSON.stringify({ event: "alipay_certify_init_response", initResult }),
    );

    const subCode = initResult.subCode as string | undefined;
    if (subCode === "isv.illegal-client-ip" && !this.isProduction) {
      this.logger.warn(
        JSON.stringify({
          event: "alipay_certify_init_mocked",
          reason: "illegal_client_ip",
          studentId,
        }),
      );
      return { certifyId: `dev-cert-${studentId}`, certifyUrl: "" };
    }

    const certifyId = initResult.certifyId as string | undefined;
    if (!certifyId) {
      throw new Error(
        `certify initialize failed: ${JSON.stringify(initResult)}`,
      );
    }

    const certifyResult = await this.sdk.exec(
      "alipay.user.certify.open.certify",
      { bizContent: { certify_id: certifyId } },
    );
    const certifyUrl = (certifyResult as Record<string, unknown>)
      .certifyUrl as string;

    return { certifyId, certifyUrl };
  }

  async queryCertify(
    certifyId: string,
  ): Promise<{ passed: boolean; name?: string; certNo?: string }> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_certify_query_mocked",
            reason: "sdk_not_configured",
            certifyId,
          }),
        );
        // 模拟成功：1990-01-01 出生，年龄 35 ≥ 18
        return {
          passed: true,
          name: "测试用户",
          certNo: "310101199001010010",
        };
      }
      throw new Error("AlipaySDK not configured");
    }

    let resp: Record<string, unknown>;
    try {
      resp = (await this.sdk.exec("alipay.user.certify.open.query", {
        bizContent: { certify_id: certifyId },
      })) as Record<string, unknown>;
    } catch (err) {
      const subCode = (err as Record<string, unknown>)?.subCode as
        | string
        | undefined;
      if (subCode === "isv.illegal-client-ip" && !this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_certify_query_mocked",
            reason: "illegal_client_ip",
            certifyId,
          }),
        );
        return { passed: true, name: "测试用户", certNo: "310101199001010010" };
      }
      throw err;
    }

    if (
      (resp.subCode as string | undefined) === "isv.illegal-client-ip" &&
      !this.isProduction
    ) {
      return { passed: true, name: "测试用户", certNo: "310101199001010010" };
    }

    const passed = resp.passed === "T";

    if (!passed) return { passed: false };

    const identityInfoStr = resp.identityInfo as string | undefined;
    if (!identityInfoStr) return { passed: true };

    try {
      const info = JSON.parse(identityInfoStr) as {
        name?: string;
        cert_no?: string;
      };
      return { passed: true, name: info.name, certNo: info.cert_no };
    } catch {
      return { passed: true };
    }
  }

  decryptPhone(encryptedData: string, iv?: string): string {
    // 尝试直接 JSON 解析（开放平台未开启「接口内容加密」时，response 是明文 JSON）
    try {
      const plain = JSON.parse(encryptedData) as Record<string, unknown>;
      const phone = (plain.mobile ?? plain.phoneNumber ?? plain.mobileNo) as
        | string
        | undefined;
      if (phone) {
        this.logger.log(
          JSON.stringify({ event: "alipay_phone_plain", phone }),
        );
        return phone;
      }
    } catch {
      // 不是明文 JSON，走 AES 解密
    }

    const aesKeyBase64 = process.env.ALIPAY_AES_KEY;

    if (!aesKeyBase64) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_phone_decrypt_mocked",
            reason: "ALIPAY_AES_KEY not set",
            phone: this.devPhone,
          }),
        );
        return this.devPhone;
      }
      throw new Error("ALIPAY_AES_KEY is required in production");
    }

    try {
      const key = Buffer.from(aesKeyBase64, "base64");
      const ivBuf = iv
        ? Buffer.from(iv, "base64")
        : Buffer.alloc(16, 0);
      const decipher = createDecipheriv("aes-128-cbc", key, ivBuf);
      let decrypted = decipher.update(encryptedData, "base64", "utf8");
      decrypted += decipher.final("utf8");
      this.logger.log(
        JSON.stringify({ event: "alipay_phone_decrypted_raw", decrypted }),
      );
      const data = JSON.parse(decrypted) as Record<string, unknown>;
      const phone = (data.mobile ?? data.phoneNumber ?? data.mobileNo) as
        | string
        | undefined;
      if (!phone) {
        throw new Error(`Phone field missing in decrypted data: ${decrypted}`);
      }
      return phone;
    } catch (err) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({
            event: "alipay_phone_decrypt_mocked",
            reason: "decryption_failed",
            phone: this.devPhone,
          }),
        );
        return this.devPhone;
      }
      throw err;
    }
  }
}
