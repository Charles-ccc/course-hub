import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface RealnameResult {
  success: boolean;
  age: number;
}

@Injectable()
export class RealnameService {
  constructor(private config: ConfigService) {}

  async verifyFourElements(dto: { name: string; idNo: string; phone: string; bankCard?: string }): Promise<RealnameResult> {
    const apiUrl = this.config.get('REALNAME_API_URL');
    const apiKey = this.config.get('REALNAME_API_KEY');

    if (!apiUrl) {
      // 开发环境 mock
      const birthYear = parseInt(dto.idNo.substring(6, 10), 10);
      const age = new Date().getFullYear() - birthYear;
      return { success: true, age };
    }

    const { data } = await axios.post(`${apiUrl}/verify/four-elements`, {
      name: dto.name,
      idNo: dto.idNo,
      phone: dto.phone,
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return {
      success: data.result === 'consistent',
      age: data.age,
    };
  }
}
