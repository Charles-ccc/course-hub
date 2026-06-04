import { Module } from '@nestjs/common';
import { InstallmentController } from './installment.controller';
import { InstallmentService } from './installment.service';
import { DeductionService } from './deduction.service';

@Module({
  controllers: [InstallmentController],
  providers: [InstallmentService, DeductionService],
  exports: [InstallmentService, DeductionService],
})
export class InstallmentModule {}
