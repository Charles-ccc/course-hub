import { Injectable, Logger } from "@nestjs/common";
import { AlipaySdk } from "alipay-sdk";

@Injectable()
export class AlipayService {
  private readonly logger = new Logger(AlipayService.name);
  private readonly sdk: AlipaySdk | null = null;
  private readonly isProduction = process.env.NODE_ENV === "production";
  private readonly devOpenId =
    process.env.ALIPAY_DEV_OPEN_ID ?? "2088000000000001";

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
}
