import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get(':orderId')
  getByOrder(@CurrentUser('id') studentId: string, @Param('orderId') orderId: string) {
    return this.contractService.getByOrder(studentId, orderId);
  }

  @Get(':orderId/sign-url')
  getSignUrl(@CurrentUser('id') studentId: string, @Param('orderId') orderId: string) {
    return this.contractService.getSignUrl(studentId, orderId);
  }
}
