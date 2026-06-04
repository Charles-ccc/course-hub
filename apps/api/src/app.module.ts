import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./common/prisma/prisma.module";
import { UserModule } from "./modules/user/user.module";
import { OrgModule } from "./modules/org/org.module";
import { CourseModule } from "./modules/course/course.module";
import { OrderModule } from "./modules/order/order.module";
import { InstallmentModule } from "./modules/installment/installment.module";
import { CreditModule } from "./modules/credit/credit.module";
import { ContractModule } from "./modules/contract/contract.module";
import { CommissionModule } from "./modules/commission/commission.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { LearningModule } from "./modules/learning/learning.module";
import { SettlementModule } from "./modules/settlement/settlement.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { ReportModule } from "./modules/report/report.module";
import { PlatformConfigModule } from "./modules/config/config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MockApiStateService } from "./mock/mock-api-state.service";
import { MockApiMiddleware } from "./mock/mock-api.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    OrgModule,
    CourseModule,
    OrderModule,
    InstallmentModule,
    CreditModule,
    ContractModule,
    CommissionModule,
    ReferralModule,
    LearningModule,
    SettlementModule,
    NotificationModule,
    ReportModule,
    PlatformConfigModule,
  ],
  providers: [MockApiStateService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MockApiMiddleware).forRoutes("*");
  }
}
