import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPasswordHash = await hash("admin123", 10);
  const insitutionPasswordHash = await hash("123456", 10);
  const salesmanPasswordHash = await hash("123456", 10);

  // ── 清空（依赖顺序从叶到根）──────────────────────────────────
  await prisma.commission.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.checkinRecord.deleteMany();
  await prisma.signRecord.deleteMany();
  await prisma.realnameRecord.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.question.deleteMany();
  await prisma.settlementRecord.deleteMany();
  await prisma.courseVideo.deleteMany();
  await prisma.student.deleteMany();
  await prisma.orgCode.deleteMany();
  await prisma.salesman.deleteMany();
  await prisma.course.deleteMany();
  await prisma.insitutionUser.deleteMany();
  await prisma.insitution.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.systemConfig.deleteMany();

  // ── 平台管理员 ─────────────────────────────────────────────
  await prisma.adminUser.create({
    data: {
      id: "admin-1",
      username: "admin",
      displayName: "平台管理员",
      passwordHash: adminPasswordHash,
      role: "PLATFORM_ADMIN",
    },
  });

  // ── 机构 ───────────────────────────────────────────────────
  await prisma.insitution.createMany({
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

  // ── 机构管理员 ─────────────────────────────────────────────
  await prisma.insitutionUser.create({
    data: {
      id: "insitution-user-1",
      phone: "13800138000",
      displayName: "欢乐学示例机构",
      passwordHash: insitutionPasswordHash,
      role: "INSITUTION_ADMIN",
      insitutionId: "org-1001",
    },
  });

  // ── 课程 ───────────────────────────────────────────────────
  await prisma.course.createMany({
    data: [
      {
        id: "course-1",
        insitutionId: "org-1001",
        name: "英语冲刺提升班",
        description: "适合中学阶段的英语能力提升课程，涵盖听说读写全面训练。",
        instructorInfo: "王老师，10年教学经验",
        outline: "第1期：基础语法夯实\n第2期：词汇与阅读\n第3期：听力与口语\n第4期：写作专项\n第5-12期：综合强化与模拟测试",
        teacherContact: "微信：wanglaoshi2026 | 电话：0571-88001234",
        priceCents: 129900,
        periodCount: 12,
        status: "ONLINE",
        auditStatus: "APPROVED",
      },
      {
        id: "course-2",
        insitutionId: "org-1001",
        name: "数学系统强化班",
        description: "覆盖函数、几何、代数等核心知识点，适合中考/高考冲刺。",
        instructorInfo: "李老师，省级竞赛教练",
        outline: "第1期：函数基础\n第2期：解析几何\n第3期：数列与极限\n第4-10期：专题练习与真题讲解",
        teacherContact: "微信：lilaoshi_math | 电话：0571-88005678",
        priceCents: 99900,
        periodCount: 10,
        status: "OFFLINE",
        auditStatus: "APPROVED",
      },
      {
        id: "course-3",
        insitutionId: "org-1002",
        name: "物理拔高专题班",
        description: "高频考点专项冲刺，针对压轴题突破训练。",
        instructorInfo: "张老师，重点中学教研组长",
        priceCents: 159900,
        periodCount: 12,
        status: "OFFLINE",
        auditStatus: "PENDING_REVIEW",
      },
    ],
  });

  // ── 课程视频 ────────────────────────────────────────────────
  await prisma.courseVideo.createMany({
    data: [
      {
        id: "video-1-1",
        courseId: "course-1",
        title: "第1节：基础语法——时态总览",
        videoKey: "vod/course-1/ep01.mp4",
        durationSec: 2700,
        sortOrder: 1,
        isTrial: true,
      },
      {
        id: "video-1-2",
        courseId: "course-1",
        title: "第2节：冠词与名词用法",
        videoKey: "vod/course-1/ep02.mp4",
        durationSec: 2580,
        sortOrder: 2,
        isTrial: false,
      },
      {
        id: "video-1-3",
        courseId: "course-1",
        title: "第3节：动词短语精讲",
        videoKey: "vod/course-1/ep03.mp4",
        durationSec: 3000,
        sortOrder: 3,
        isTrial: false,
      },
      {
        id: "video-2-1",
        courseId: "course-2",
        title: "第1节：函数基础——定义与性质",
        videoKey: "vod/course-2/ep01.mp4",
        durationSec: 3300,
        sortOrder: 1,
        isTrial: true,
      },
    ],
  });

  // ── 业务员 ─────────────────────────────────────────────────
  await prisma.salesman.create({
    data: {
      id: "sales-1",
      insitutionId: "org-1001",
      username: "sales01",
      passwordHash: salesmanPasswordHash,
      name: "陈晓东",
      phone: "13800138001",
      contractType: "EMPLOYEE",
      groupName: "华东增长组",
      status: "ACTIVE",
      studentCount: 3,
      cumulativeCommissionCents: 860000,
    },
  });

  // ── 机构码（业务员推广码）─────────────────────────────────
  await prisma.orgCode.createMany({
    data: [
      {
        id: "orgcode-1",
        insitutionId: "org-1001",
        salesmanId: "sales-1",
        code: "CHENXD2026",
        status: "ACTIVE",
        usedCount: 3,
      },
      {
        id: "orgcode-2",
        insitutionId: "org-1001",
        salesmanId: "sales-1",
        code: "HUADONG888",
        status: "ACTIVE",
        usedCount: 0,
      },
    ],
  });

  // ── 学员（含 alipayOpenId mock 值）────────────────────────
  // alipayOpenId 为支付宝真实 userId 格式（2088 开头 16 位），这里用 mock 值
  await prisma.student.createMany({
    data: [
      {
        id: "stu-1001",
        insitutionId: "org-1001",
        orgCodeId: "orgcode-1",
        boundSalesmanId: "sales-1",
        name: "林同学",
        phone: "13800138021",
        alipayOpenId: "2088000000000001",
        realnameStatus: "VERIFIED",
        boundAt: new Date(),
      },
      {
        id: "stu-1002",
        insitutionId: "org-1001",
        orgCodeId: "orgcode-1",
        boundSalesmanId: "sales-1",
        name: "张同学",
        phone: "13800138022",
        alipayOpenId: "2088000000000002",
        realnameStatus: "VERIFIED",
        boundAt: new Date(),
      },
      {
        id: "stu-1003",
        insitutionId: "org-1001",
        orgCodeId: "orgcode-1",
        boundSalesmanId: "sales-1",
        name: "周同学",
        phone: "13800138023",
        alipayOpenId: "2088000000000003",
        realnameStatus: "UNVERIFIED",
        boundAt: new Date(),
      },
    ],
  });

  // ── 订单 ───────────────────────────────────────────────────
  await prisma.order.createMany({
    data: [
      {
        id: "order-1001",
        insitutionId: "org-1001",
        studentId: "stu-1001",
        courseId: "course-1",
        orgCodeId: "orgcode-1",
        studentName: "林同学",
        courseName: "英语冲刺提升班",
        totalAmountCents: 129900,
        periodCount: 12,
        payType: "DEFERRED",
        status: "ACTIVE",
      },
      {
        id: "order-1002",
        insitutionId: "org-1001",
        studentId: "stu-1002",
        courseId: "course-2",
        orgCodeId: "orgcode-1",
        studentName: "张同学",
        courseName: "数学系统强化班",
        totalAmountCents: 99900,
        periodCount: 10,
        payType: "DEFERRED",
        status: "COOLING_OFF",
        coolingOffEndAt: new Date(),
      },
      {
        id: "order-1003",
        insitutionId: "org-1001",
        studentId: "stu-1003",
        courseId: "course-1",
        orgCodeId: "orgcode-1",
        studentName: "周同学",
        courseName: "英语冲刺提升班",
        totalAmountCents: 129900,
        periodCount: 12,
        payType: "IMMEDIATE",
        status: "ACTIVE",
      },
      {
        id: "order-1004",
        insitutionId: "org-1002",
        studentId: null,
        courseId: "course-3",
        studentName: "吴同学",
        courseName: "物理拔高专题班",
        totalAmountCents: 159900,
        periodCount: 12,
        payType: "DEFERRED",
        status: "REFUNDED",
      },
    ],
  });

  // ── 分期 ───────────────────────────────────────────────────
  await prisma.installment.createMany({
    data: [
      {
        id: "ins-1",
        orderId: "order-1001",
        periodNo: 1,
        dueDate: new Date("2026-05-01"),
        plannedAmountCents: 10825,
        paidAmountCents: 10825,
        contentDeliveredAt: new Date("2026-05-01"),
        status: "PAID",
      },
      {
        id: "ins-2",
        orderId: "order-1001",
        periodNo: 2,
        dueDate: new Date("2026-06-01"),
        plannedAmountCents: 10825,
        paidAmountCents: 0,
        contentDeliveredAt: new Date("2026-06-01"),
        status: "DELIVERED",
      },
      {
        id: "ins-3",
        orderId: "order-1003",
        periodNo: 1,
        dueDate: new Date("2026-04-01"),
        plannedAmountCents: 10825,
        paidAmountCents: 0,
        status: "OVERDUE",
      },
    ],
  });

  // ── 结算记录 ────────────────────────────────────────────────
  await prisma.settlementRecord.createMany({
    data: [
      {
        id: "set-2026-05-org-1001",
        insitutionId: "org-1001",
        period: "2026-05",
        gmvCents: 1020000,
        serviceFeeCents: 86700,
        status: "PENDING",
      },
      {
        id: "set-2026-04-org-1001",
        insitutionId: "org-1001",
        period: "2026-04",
        gmvCents: 880000,
        serviceFeeCents: 74800,
        status: "SETTLED",
        settledAt: new Date("2026-05-05"),
      },
    ],
  });

  // ── 问答 ───────────────────────────────────────────────────
  await prisma.question.createMany({
    data: [
      {
        id: "qa-1",
        insitutionId: "org-1001",
        studentName: "林同学",
        content: "课程是否支持补课回放？",
        replied: false,
      },
      {
        id: "qa-2",
        insitutionId: "org-1001",
        studentName: "张同学",
        content: "每周几节课？",
        replied: true,
        replyContent: "每周固定两节直播课，另外有录播回放。",
        repliedAt: new Date(),
      },
    ],
  });

  // ── 系统配置 ────────────────────────────────────────────────
  await prisma.systemConfig.create({
    data: {
      key: "default",
      priceLimitCents: 200000,
      minAge: 8,
      maxAge: 18,
      zhimaEnabled: true,
    },
  });

  // ── 佣金 ───────────────────────────────────────────────────
  await prisma.commission.createMany({
    data: [
      {
        id: "comm-1",
        staffId: "sales-1",
        orderId: "order-1001",
        type: "CLOSING",
        status: "SETTLED",
        amountCents: 12000,
        studentName: "林同学",
        courseName: "英语冲刺提升班",
      },
      {
        id: "comm-2",
        staffId: "sales-1",
        orderId: "order-1002",
        type: "PERFORMANCE",
        periodNo: 2,
        status: "PENDING",
        amountCents: 3600,
        studentName: "张同学",
        courseName: "数学系统强化班",
      },
      {
        id: "comm-3",
        staffId: "sales-1",
        orderId: "order-1003",
        type: "PERFORMANCE",
        periodNo: 1,
        status: "HELD",
        amountCents: 2800,
        studentName: "周同学",
        courseName: "英语冲刺提升班",
      },
    ],
  });

  console.log("✅ Seed 完成");
  console.log("   机构码可用于测试注册: CHENXD2026 / HUADONG888");
  console.log("   mock 学员 alipayOpenId: 2088000000000001 ~ 2088000000000003");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
