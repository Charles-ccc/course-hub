import { Module } from "@nestjs/common";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InsitutionModule } from "./modules/insitution/insitution.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, InsitutionModule],
})
export class AppModule {}
