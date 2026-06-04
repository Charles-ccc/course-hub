import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async getByOrder(studentId: string, orderId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { orderId },
      include: { order: true },
    });
    if (!contract || contract.order.studentId !== studentId) throw new NotFoundException('合同不存在');
    return contract;
  }

  async getSignUrl(studentId: string, orderId: string) {
    const contract = await this.getByOrder(studentId, orderId);
    // 对接 e签宝/法大大，获取签署链接（甲方=机构已签，学员侧签署）
    const signUrl = await this.esignGetUrl(contract.esignRef || '');
    return { signUrl };
  }

  private async esignGetUrl(esignRef: string): Promise<string> {
    const baseUrl = this.config.get('ESIGN_BASE_URL');
    const appId = this.config.get('ESIGN_APP_ID');
    if (!baseUrl) return `https://mock-esign.com/sign/${esignRef}`;

    const { data } = await axios.get(`${baseUrl}/api/1/sign/page/create`, {
      headers: { 'X-Tsign-Open-App-Id': appId },
      params: { flowId: esignRef },
    });
    return data.data?.shortUrl || '';
  }
}
