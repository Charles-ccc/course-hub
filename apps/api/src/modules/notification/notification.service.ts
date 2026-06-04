import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type NotifyType = 'payment_due' | 'payment_success' | 'payment_failed' | 'cooling_off_end' | 'referral_reward';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private config: ConfigService) {}

  async sendSms(phone: string, type: NotifyType, params: Record<string, string>) {
    // 接入阿里云短信，催收提醒需满足合规时段（8:00-21:00）
    const hour = new Date().getHours();
    if (type === 'payment_due' && (hour < 8 || hour >= 21)) {
      this.logger.warn(`催收短信合规拦截：当前时段 ${hour}:00 不允许发送`);
      return;
    }

    const accessKey = this.config.get('SMS_ACCESS_KEY_ID');
    if (!accessKey) {
      this.logger.log(`[SMS Mock] ${phone} - ${type}: ${JSON.stringify(params)}`);
      return;
    }

    // 生产：调用阿里云 SendSms
    this.logger.log(`SMS sent to ${phone}: ${type}`);
  }

  async sendWechatTemplateMsg(openid: string, templateId: string, data: Record<string, any>) {
    // 调用微信模板消息接口
    this.logger.log(`Wechat template msg to ${openid}: ${templateId}`);
  }

  async sendAlipayTemplateMsg(userId: string, templateId: string, data: Record<string, any>) {
    // 调用支付宝消息模板接口
    this.logger.log(`Alipay template msg to ${userId}: ${templateId}`);
  }

  async notifyPaymentDue(phone: string, openid: string | null, amount: number, dueDate: string) {
    await this.sendSms(phone, 'payment_due', {
      amount: (amount / 100).toFixed(2),
      dueDate,
    });
    if (openid) {
      await this.sendWechatTemplateMsg(openid, 'PAYMENT_DUE_TPL', { amount, dueDate });
    }
  }

  async notifyPaymentSuccess(phone: string, amount: number) {
    await this.sendSms(phone, 'payment_success', { amount: (amount / 100).toFixed(2) });
  }
}
