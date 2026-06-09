import dayjs from "dayjs";
import type {
  CourseDto,
  InstitutionDepositDto,
  OrderDto,
  OverduePeriodDto,
  QaQuestionDto,
  SettlementRecordDto,
} from "../types/api";

export const profileMock: InstitutionDepositDto = {
  orgId: "org-1001",
  orgName: "欢乐学示例机构",
  settlementRate: 8.5,
  depositBalanceCents: 5000000,
};

export const coursesMock: CourseDto[] = [
  {
    id: "course-1",
    name: "英语冲刺提升班",
    description: "适合中学阶段的英语能力提升课程。",
    instructorInfo: "王老师，10年教学经验",
    priceCents: 129900,
    periodCount: 12,
    status: "ONLINE",
  },
  {
    id: "course-2",
    name: "数学系统强化班",
    description: "覆盖函数、几何、代数等核心知识点。",
    instructorInfo: "李老师，省级竞赛教练",
    priceCents: 99900,
    periodCount: 10,
    status: "OFFLINE",
  },
];

export const ordersMock: OrderDto[] = [
  {
    id: "order-1001",
    studentName: "林同学",
    courseName: "英语冲刺提升班",
    totalAmountCents: 129900,
    periodCount: 12,
    status: "ACTIVE",
    createdAt: dayjs().subtract(10, "day").toISOString(),
    installments: [
      {
        id: "ins-1",
        periodNo: 1,
        dueDate: dayjs().subtract(2, "day").toISOString(),
        plannedAmountCents: 10825,
        paidAmountCents: 10825,
        contentDeliveredAt: dayjs().subtract(3, "day").toISOString(),
        status: "PAID",
      },
      {
        id: "ins-2",
        periodNo: 2,
        dueDate: dayjs().add(28, "day").toISOString(),
        plannedAmountCents: 10825,
        paidAmountCents: 0,
        contentDeliveredAt: dayjs().toISOString(),
        status: "DELIVERED",
      },
    ],
  },
  {
    id: "order-1002",
    studentName: "张同学",
    courseName: "数学系统强化班",
    totalAmountCents: 99900,
    periodCount: 10,
    status: "COOLING_OFF",
    coolingOffEndAt: dayjs().add(3, "day").toISOString(),
    createdAt: dayjs().subtract(2, "day").toISOString(),
    installments: [],
  },
  {
    id: "order-1003",
    studentName: "赵同学",
    courseName: "英语冲刺提升班",
    totalAmountCents: 129900,
    periodCount: 12,
    status: "COMPLETED",
    createdAt: dayjs().subtract(30, "day").toISOString(),
    installments: [],
  },
];

export const overduePeriodsMock: OverduePeriodDto[] = [
  {
    id: "overdue-1",
    orderId: "order-1004",
    studentName: "周同学",
    courseName: "英语冲刺提升班",
    periodNo: 3,
    dueDate: dayjs().subtract(5, "day").toISOString(),
    plannedAmountCents: 10825,
    status: "OVERDUE",
  },
  {
    id: "overdue-2",
    orderId: "order-1005",
    studentName: "吴同学",
    courseName: "数学系统强化班",
    periodNo: 2,
    dueDate: dayjs().subtract(11, "day").toISOString(),
    plannedAmountCents: 9990,
    status: "OVERDUE",
  },
];

export const settlementsMock: SettlementRecordDto[] = [
  {
    id: "set-2026-04",
    period: "2026-04",
    gmvCents: 880000,
    serviceFeeCents: 74800,
    status: "SETTLED",
  },
  {
    id: "set-2026-05",
    period: "2026-05",
    gmvCents: 1020000,
    serviceFeeCents: 86700,
    status: "PENDING",
  },
];

export const qaMock: QaQuestionDto[] = [
  {
    id: "qa-1",
    studentName: "林同学",
    content: "课程是否支持补课回放？",
    askedAt: dayjs().subtract(1, "day").toISOString(),
    replied: false,
  },
  {
    id: "qa-2",
    studentName: "张同学",
    content: "每周几节课？",
    askedAt: dayjs().subtract(3, "day").toISOString(),
    replied: true,
    replyContent: "每周固定两节直播课，另外有录播回放。",
    repliedAt: dayjs().subtract(2, "day").toISOString(),
  },
];
