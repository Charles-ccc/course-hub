import { getSession } from "../auth/session";
import type {
  AuthSession,
  Course,
  InstitutionProfile,
  Installment,
  Order,
  OverduePeriod,
  QaQuestion,
  SettlementRecord,
} from "../types/domain";
import type {
  CourseDto,
  InstitutionDepositDto,
  InstallmentDto,
  LoginResponseDto,
  OrderDto,
  OverduePeriodDto,
  QaQuestionDto,
  SettlementRecordDto,
} from "../types/api";

export const adaptLoginResponse = (dto: LoginResponseDto): AuthSession => ({
  token: dto.accessToken,
  refreshToken: dto.refreshToken ?? "",
  role: dto.role,
  orgId: dto.orgId ?? dto.userId,
  orgName: dto.orgName ?? dto.displayName,
});

export const adaptInstitutionProfile = (
  dto: InstitutionDepositDto,
): InstitutionProfile => {
  const session = getSession();

  return {
    orgId: dto.orgId ?? session?.orgId ?? "",
    orgName: dto.orgName ?? session?.orgName ?? "",
    settlementRate: dto.settlementRate,
    depositBalanceCents: dto.depositBalanceCents,
  };
};

export const adaptCourse = (dto: CourseDto): Course => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  instructorInfo: dto.instructorInfo,
  priceCents: dto.priceCents,
  periodCount: dto.periodCount,
  status: dto.status,
});

export const adaptInstallment = (dto: InstallmentDto): Installment => ({
  id: dto.id,
  periodNo: dto.periodNo,
  dueDate: dto.dueDate,
  plannedAmountCents: dto.plannedAmountCents ?? dto.amountCents ?? 0,
  paidAmountCents: dto.paidAmountCents ?? 0,
  contentDeliveredAt: dto.contentDeliveredAt,
  status: dto.status,
});

export const adaptOrder = (dto: OrderDto): Order => ({
  id: dto.id,
  studentName: dto.studentName,
  courseName: dto.courseName,
  totalAmountCents: dto.totalAmountCents,
  periodCount: dto.periodCount,
  status: dto.status,
  coolingOffEndAt: dto.coolingOffEndAt,
  createdAt: dto.createdAt,
  installments: (dto.installments ?? []).map(adaptInstallment),
});

export const adaptOverduePeriod = (dto: OverduePeriodDto): OverduePeriod => ({
  id: dto.id,
  orderId: dto.orderId,
  studentName: dto.studentName,
  courseName: dto.courseName,
  periodNo: dto.periodNo,
  dueDate: dto.dueDate,
  plannedAmountCents: dto.plannedAmountCents ?? dto.amountCents ?? 0,
  status: dto.status,
});

export const adaptSettlementRecord = (
  dto: SettlementRecordDto,
): SettlementRecord => ({
  id: dto.id,
  period: dto.period,
  gmvCents: dto.gmvCents,
  serviceFeeCents: dto.serviceFeeCents,
  status: dto.status,
});

export const adaptQaQuestion = (dto: QaQuestionDto): QaQuestion => ({
  id: dto.id,
  studentName: dto.studentName,
  content: dto.content,
  askedAt: dto.askedAt,
  replied: dto.replied,
  replyContent: dto.replyContent,
  repliedAt: dto.repliedAt,
});
