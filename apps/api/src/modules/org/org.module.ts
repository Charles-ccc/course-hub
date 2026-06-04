import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { AdminOrgController } from './org.controller';
import { OrgService } from './org.service';

@Module({
  controllers: [OrgController, AdminOrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
