import { Module } from '@nestjs/common';
import { CommissionController, AdminStaffController } from './commission.controller';
import { CommissionService } from './commission.service';

@Module({
  controllers: [CommissionController, AdminStaffController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
