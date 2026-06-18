import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { StudentController } from "./student.controller";
import { RealnameService } from "./realname.service";
import { StudentAuthModule } from "../student-auth/student-auth.module";
import { TokenService } from "../../common/auth/token.service";
import { Reflector } from "@nestjs/core";

@Module({
  imports: [StudentAuthModule],
  controllers: [StudentController],
  providers: [RealnameService, TokenService, JwtService, Reflector],
})
export class StudentModule {}
