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
    certName: string,
    certNo: string,
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

    // 「人脸认证」datadigital.fincloud.generalsaas.face.certify.*
    // 实测可用：对象格式 identity_param + merchant_config
    const bizContent = {
      outer_order_no: outerOrderNo,
      biz_code: "FACE",
      identity_param: {
        identity_type: "CERT_INFO",
        cert_type: "IDENTITY_CARD",
        cert_name: certName,
        cert_no: certNo,
      },
      merchant_config: {
        return_url: "https://api.happymaa.cn/api/v1/users/realname/callback",
      },
    };
    this.logger.log(
      JSON.stringify({ event: "alipay_certify_init_request", bizContent }),
    );

    // Step 1: initialize → certify_id
    let initResult: Record<string, unknown>;
    try {
      initResult = (await this.sdk.exec(
        "datadigital.fincloud.generalsaas.face.certify.initialize",
        { bizContent },
      )) as Record<string, unknown>;
    } catch (err) {
      this.logger.error(
        JSON.stringify({ event: "alipay_certify_init_error", err }),
      );
      throw new Error(`certify initialize failed: ${JSON.stringify(err)}`);
    }

    this.logger.log(
      JSON.stringify({ event: "alipay_certify_init_response", initResult }),
    );

    const certifyId = initResult.certifyId as string | undefined;
    if (!certifyId) {
      throw new Error(
        `certify initialize failed: ${JSON.stringify(initResult)}`,
      );
    }

    // Step 2: verify → 拿 web-view 加载的 H5 url
    let urlResult: Record<string, unknown>;
    try {
      urlResult = (await this.sdk.exec(
        "datadigital.fincloud.generalsaas.face.certify.verify",
        { bizContent: { certify_id: certifyId } },
      )) as Record<string, unknown>;
    } catch (err) {
      this.logger.error(
        JSON.stringify({
          event: "alipay_certify_url_error",
          certifyId,
          err,
        }),
      );
      throw new Error(`certify get-url failed: ${JSON.stringify(err)}`);
    }

    this.logger.log(
      JSON.stringify({ event: "alipay_certify_url_response", urlResult }),
    );

    const certifyUrl = (
      (urlResult.certifyUrl ??
        urlResult.url ??
        urlResult.pageUrl) as string | undefined
    ) ?? "";

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
      resp = (await this.sdk.exec(
        "datadigital.fincloud.generalsaas.face.certify.query",
        { bizContent: { certify_id: certifyId } },
      )) as Record<string, unknown>;
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

    this.logger.log(
      JSON.stringify({ event: "alipay_certify_query_response", resp }),
    );

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

  // ── 芝麻先享 ──────────────────────────────────────────────

  async createZhimaCreditOrder(params: {
    outOrderNo: string;
    totalAmountCents: number;
    perPeriodAmountCents: number;
    periodCount: number;
    courseName: string;
  }): Promise<{ creditBizOrderId: string; schemeUrl: string }> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({ event: "zhima_create_mocked", reason: "sdk_not_configured" }),
        );
        return { creditBizOrderId: `dev-zhima-${params.outOrderNo}`, schemeUrl: "" };
      }
      throw new Error("AlipaySDK not configured");
    }

    const totalYuan = (params.totalAmountCents / 100).toFixed(2);
    const perPeriodYuan = (params.perPeriodAmountCents / 100).toFixed(2);

    let result: Record<string, unknown>;
    try {
      result = (await this.sdk.exec(
        "zhima.credit.payafteruse.creditbizorder.create",
        {
          bizContent: {
            out_order_no: params.outOrderNo,
            credit_amount: totalYuan,
            income_amount: perPeriodYuan,
            period_type: "MONTH",
            period: String(params.periodCount),
            product_code: "w1010100100000000001",
            credit_mer_info: params.courseName,
            pay_notify_url: `${process.env.API_BASE_URL ?? "https://api.happymaa.cn/api/v1"}/orders/zhima/notify`,
            mer_return_url: `alipays://platformapi/startapp?appId=${process.env.ALIPAY_APP_ID ?? ""}&page=pages%2Forder%2Flist%2Findex`,
          },
        },
      )) as Record<string, unknown>;
    } catch (err) {
      this.logger.error(
        JSON.stringify({ event: "zhima_create_error", err: String(err) }),
      );
      throw new Error(`ZHIMA_API_UNAVAILABLE: ${String(err)}`);
    }

    this.logger.log(JSON.stringify({ event: "zhima_create_response", result }));

    const creditBizOrderId = result.creditBizOrderId as string | undefined;
    const schemeUrl = (result.schemeUrl ?? result.scheme ?? "") as string;
    if (!creditBizOrderId) {
      this.logger.error(
        JSON.stringify({ event: "zhima_create_no_order_id", result }),
      );
      throw new Error(`ZHIMA_API_UNAVAILABLE: missing creditBizOrderId`);
    }

    return { creditBizOrderId, schemeUrl };
  }

  async queryZhimaCreditOrder(params: {
    outOrderNo: string;
    creditBizOrderId: string;
  }): Promise<{ signed: boolean; status: string }> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(
          JSON.stringify({ event: "zhima_query_mocked", reason: "sdk_not_configured" }),
        );
        return { signed: true, status: "SIGNED" };
      }
      throw new Error("AlipaySDK not configured");
    }

    const result = (await this.sdk.exec(
      "zhima.credit.payafteruse.creditbizorder.query",
      {
        bizContent: {
          out_order_no: params.outOrderNo,
          credit_biz_order_id: params.creditBizOrderId,
        },
      },
    )) as Record<string, unknown>;

    this.logger.log(JSON.stringify({ event: "zhima_query_response", result }));

    const status = (result.status ?? result.bizStatus ?? "") as string;
    return { signed: status === "SIGNED", status };
  }

  verifyNotifySign(params: Record<string, string>): boolean {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(JSON.stringify({ event: "zhima_notify_verify_mocked" }));
        return true;
      }
      return false;
    }
    try {
      return (this.sdk as unknown as { checkNotifySign(p: Record<string, string>): boolean })
        .checkNotifySign(params);
    } catch {
      return false;
    }
  }

  async createAlipayTrade(params: {
    outTradeNo: string;
    totalAmountCents: number;
    subject: string;
    buyerOpenId: string;
  }): Promise<{ tradeNo: string }> {
    if (!this.sdk) {
      if (!this.isProduction) {
        this.logger.warn(JSON.stringify({ event: "alipay_trade_mocked" }));
        return { tradeNo: `dev-trade-${params.outTradeNo}` };
      }
      throw new Error("AlipaySDK not configured");
    }

    const totalYuan = (params.totalAmountCents / 100).toFixed(2);
    const result = (await this.sdk.exec("alipay.trade.create", {
      bizContent: {
        out_trade_no: params.outTradeNo,
        total_amount: totalYuan,
        subject: params.subject,
        buyer_open_id: params.buyerOpenId,
        product_code: "FACE_TO_FACE_PAYMENT",
      },
    })) as Record<string, unknown>;

    this.logger.log(JSON.stringify({ event: "alipay_trade_create_response", result }));

    const tradeNo = result.tradeNo as string | undefined;
    if (!tradeNo) {
      throw new Error(`alipay trade create failed: ${JSON.stringify(result)}`);
    }
    return { tradeNo };
  }

  // ── 手机号解密 ───────────────────────────────────────────

  decryptPhone(encryptedData: string, iv?: string): string {
    // my.getPhoneNumber 返回 {response: "<AES密文base64>", sign: "..."} 格式
    // 或未开启接口内容加密时直接返回 {mobile: "..."} 明文 JSON
    let ciphertext = encryptedData;
    try {
      const parsed = JSON.parse(encryptedData) as Record<string, unknown>;

      // 明文手机号
      const direct = (parsed.mobile ?? parsed.phoneNumber ?? parsed.mobileNo) as
        | string
        | undefined;
      if (direct) {
        this.logger.log(JSON.stringify({ event: "alipay_phone_plain", phone: direct }));
        return direct;
      }

      // {response, sign} 格式：取 response 字段作为真正的密文
      if (typeof parsed.response === "string") {
        ciphertext = parsed.response;
      }
    } catch {
      // 非 JSON，当作裸 base64 密文直接解密
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
      // Alipay 小程序手机号加密：IV = 16 字节全零（官方规范）
      const ivBuf = iv ? Buffer.from(iv, "base64") : Buffer.alloc(16, 0);
      const decipher = createDecipheriv("aes-128-cbc", key, ivBuf);
      let decrypted = decipher.update(ciphertext, "base64", "utf8");
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
