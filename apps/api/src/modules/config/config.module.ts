import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { PlatformConfigService } from './config.service';

@Module({
  controllers: [ConfigController],
  providers: [PlatformConfigService],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
