import { Module } from '@nestjs/common';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { BuiltInCreditProvider } from './providers/builtin.provider';
import { ZhimaCreditProvider } from './providers/zhima.provider';

@Module({
  controllers: [CreditController],
  providers: [CreditService, BuiltInCreditProvider, ZhimaCreditProvider],
  exports: [CreditService],
})
export class CreditModule {}
