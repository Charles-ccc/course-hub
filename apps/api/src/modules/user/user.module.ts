import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RealnameService } from './realname.service';

@Module({
  controllers: [UserController],
  providers: [UserService, RealnameService],
  exports: [UserService],
})
export class UserModule {}
