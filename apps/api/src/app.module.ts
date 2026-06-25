import { Module } from "@nestjs/common";
import { RequestAuditInterceptor } from "./common/interceptors/request-audit.interceptor";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CourseModule } from "./modules/course/course.module";
import { InsitutionModule } from "./modules/insitution/insitution.module";
import { LearningModule } from "./modules/learning/learning.module";
import { OrderModule } from "./modules/order/order.module";
import { StaffModule } from "./modules/staff/staff.module";
import { StudentAuthModule } from "./modules/student-auth/student-auth.module";
import { StudentModule } from "./modules/student/student.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    CourseModule,
    InsitutionModule,
    LearningModule,
    OrderModule,
    StaffModule,
    StudentAuthModule,
    StudentModule,
  ],
  providers: [RequestAuditInterceptor],
})
export class AppModule {}
