import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformConfigService {
  private store = new Map<string, any>([
    ['price_cap', 50000_00],     // 默认客单价上限：5万元（单位：分）
    ['credit_config', { zhimaEnabled: true, wechatScoreEnabled: true }],
  ]);

  get(key: string) {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: any) {
    this.store.set(key, value);
    return { key, value };
  }

  getAll() {
    return Object.fromEntries(this.store.entries());
  }
}
