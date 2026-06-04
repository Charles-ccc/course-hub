import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PlatformConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/admin/config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  @Get()
  getAll() {
    return this.configService.getAll();
  }

  @Put('price-cap')
  setPriceCap(@Body('cap') cap: number) {
    return this.configService.set('price_cap', cap);
  }

  @Put('credit')
  setCreditConfig(@Body() config: any) {
    return this.configService.set('credit_config', config);
  }
}
