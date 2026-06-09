import { Module } from "@nestjs/common";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InstitutionModule } from "./modules/institution/institution.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, InstitutionModule],
})
export class AppModule {}
