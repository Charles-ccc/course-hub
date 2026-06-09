import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPasswordHash = await hash("admin123", 10);
  const institutionPasswordHash = await hash("123456", 10);
  const salesmanPasswordHash = await hash("123456", 10);

  await prisma.installment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.question.deleteMany();
  await prisma.settlementRecord.deleteMany();
  await prisma.salesman.deleteMany();
  await prisma.course.deleteMany();
  await prisma.institutionUser.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.systemConfig.deleteMany();

  await prisma.adminUser.create({
    data: {
      id: "admin-1",
      username: "admin",
      displayName: "平台管理员",
      passwordHash: adminPasswordHash,
      role: "PLATFORM_ADMIN",
    },
  });

  await prisma.institution.createMany({
    data: [
      {
        id: "org-1001",
        name: "欢乐学杭州校区",
        socialCreditCode: "91330106784512001X",
        settlementRate: 8.5,
        depositBalanceCents: 5000000,
        cumulativeGmvCents: 24500000,
        cumulativeServiceFeeCents: 2082500,
        status: "ACTIVE",
      },
      {
        id: "org-1002",
        name: "博学教育上海中心",
        socialCreditCode: "91310115785112009K",
        settlementRate: 0,
        depositBalanceCents: 3000000,
        cumulativeGmvCents: 12600000,
        cumulativeServiceFeeCents: 982800,
        status: "PENDING",
      },
    ],
  });

  await prisma.institutionUser.create({
    data: {
      id: "institution-user-1",
      phone: "13800138000",
      displayName: "欢乐学示例机构",
      passwordHash: institutionPasswordHash,
      role: "INSTITUTION_ADMIN",
      institutionId: "org-1001",
    },
  });

  await prisma.course.createMany({
    data: [
      {
        id: "course-1",
        institutionId: "org-1001",
        name: "英语冲刺提升班",
        description: "适合中学阶段的英语能力提升课程。",
        instructorInfo: "王老师，10年教学经验",
        priceCents: 129900,
        periodCount: 12,
        status: "ONLINE",
        auditStatus: "APPROVED",
      },
      {
        id: "course-2",
        institutionId: "org-1001",
        name: "数学系统强化班",
        description: "覆盖函数、几何、代数等核心知识点。",
        instructorInfo: "李老师，省级竞赛教练",
        priceCents: 99900,
        periodCount: 10,
        status: "OFFLINE",
        auditStatus: "APPROVED",
      },
      {
        id: "course-3",
        institutionId: "org-1002",
        name: "物理拔高专题班",
        description: "高频考点专项冲刺。",
        instructorInfo: "张老师，重点中学教研组长",
        priceCents: 159900,
        periodCount: 12,
        status: "OFFLINE",
        auditStatus: "PENDING_REVIEW",
      },
    ],
  });

  await prisma.salesman.create({
    data: {
      id: "sales-1",
      institutionId: "org-1001",
      username: "sales01",
      passwordHash: salesmanPasswordHash,
      name: "陈晓东",
      phone: "13800138001",
      contractType: "EMPLOYEE",
      status: "ACTIVE",
      studentCount: 32,
      cumulativeCommissionCents: 860000,
    },
  });

  await prisma.order.createMany({
    data: [
      {
        id: "order-1001",
        institutionId: "org-1001",
        courseId: "course-1",
        studentName: "林同学",
        courseName: "英语冲刺提升班",
        totalAmountCents: 129900,
        periodCount: 12,
        status: "ACTIVE",
      },
      {
        id: "order-1002",
        institutionId: "org-1001",
        courseId: "course-2",
        studentName: "张同学",
        courseName: "数学系统强化班",
        totalAmountCents: 99900,
        periodCount: 10,
        status: "COOLING_OFF",
        coolingOffEndAt: new Date(),
      },
      {
        id: "order-1003",
        institutionId: "org-1001",
        courseId: "course-1",
        studentName: "周同学",
        courseName: "英语冲刺提升班",
        totalAmountCents: 129900,
        periodCount: 12,
        status: "ACTIVE",
      },
      {
        id: "order-1004",
        institutionId: "org-1002",
        courseId: "course-3",
        studentName: "吴同学",
        courseName: "物理拔高专题班",
        totalAmountCents: 159900,
        periodCount: 12,
        status: "REFUNDED",
      },
    ],
  });

  await prisma.installment.createMany({
    data: [
      {
        id: "ins-1",
        orderId: "order-1001",
        periodNo: 1,
        dueDate: new Date(),
        plannedAmountCents: 10825,
        paidAmountCents: 10825,
        contentDeliveredAt: new Date(),
        status: "PAID",
      },
      {
        id: "ins-2",
        orderId: "order-1001",
        periodNo: 2,
        dueDate: new Date(),
        plannedAmountCents: 10825,
        paidAmountCents: 0,
        contentDeliveredAt: new Date(),
        status: "DELIVERED",
      },
      {
        id: "ins-3",
        orderId: "order-1003",
        periodNo: 3,
        dueDate: new Date(),
        plannedAmountCents: 10825,
        paidAmountCents: 0,
        status: "OVERDUE",
      },
    ],
  });

  await prisma.settlementRecord.createMany({
    data: [
      {
        id: "set-2026-05-org-1001",
        institutionId: "org-1001",
        period: "2026-05",
        gmvCents: 1020000,
        serviceFeeCents: 86700,
        status: "PENDING",
      },
      {
        id: "set-2026-04-org-1001",
        institutionId: "org-1001",
        period: "2026-04",
        gmvCents: 880000,
        serviceFeeCents: 74800,
        status: "SETTLED",
        settledAt: new Date(),
      },
      {
        id: "set-2026-05-org-1002",
        institutionId: "org-1002",
        period: "2026-05",
        gmvCents: 720000,
        serviceFeeCents: 56160,
        status: "PENDING",
      },
    ],
  });

  await prisma.question.createMany({
    data: [
      {
        id: "qa-1",
        institutionId: "org-1001",
        studentName: "林同学",
        content: "课程是否支持补课回放？",
        replied: false,
      },
      {
        id: "qa-2",
        institutionId: "org-1001",
        studentName: "张同学",
        content: "每周几节课？",
        replied: true,
        replyContent: "每周固定两节直播课，另外有录播回放。",
        repliedAt: new Date(),
      },
    ],
  });

  await prisma.systemConfig.create({
    data: {
      key: "default",
      priceLimitCents: 200000,
      minAge: 8,
      maxAge: 18,
      zhimaEnabled: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
