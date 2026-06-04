import { Injectable, Logger } from "@nestjs/common";
import { Request } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";

type ScenarioName = "default" | "new-user" | "risk";
type ActorType = "admin" | "org" | "student" | "staff";

type OrgStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";
type CourseStatus = "ONLINE" | "OFFLINE";
type OrderStatus =
  | "CREATED"
  | "COOLING_OFF"
  | "ACTIVE"
  | "COMPLETED"
  | "REFUNDED";
type InstallmentStatus =
  | "PENDING"
  | "DELIVERED"
  | "PAID"
  | "OVERDUE"
  | "WRITTEN_OFF";
type CommissionStatus = "PENDING" | "SETTLED" | "HELD" | "CLAWED_BACK";
type CommissionType = "CLOSING" | "PERFORMANCE";

type MockResponse = {
  handled: boolean;
  status: number;
  message: string;
  data: unknown;
};

type Session = {
  token: string;
  actorType: ActorType;
  actorId: string;
  role: string;
};

type OrgRecord = {
  id: string;
  name: string;
  phone: string;
  password: string;
  unifiedCreditCode: string;
  settlementFeeRate: number;
  depositBalance: number;
  status: OrgStatus;
};

type CourseRecord = {
  id: string;
  orgId: string;
  title: string;
  outline: string;
  teacherInfo: string;
  price: number;
  periodCount: number;
  reviewPeriodDays: number;
  status: CourseStatus;
  createdAt: string;
};

type StudentRecord = {
  id: string;
  phone: string;
  realname: string;
  realnameVerified: boolean;
  ageVerifiedAdult: boolean;
  referrerStaffId?: string;
  referrerStudentId?: string;
  createdAt: string;
};

type StaffRecord = {
  id: string;
  name: string;
  phone: string;
  contractType: "EMPLOYEE" | "AGENT";
  status: "ACTIVE" | "DISABLED";
  groupName: string;
  commissionRate: number;
};

type QaQuestionRecord = {
  id: string;
  orgId: string;
  studentId: string;
  question: string;
  createdAt: string;
  replied: boolean;
  reply?: string;
  repliedAt?: string;
};

type InstallmentRecord = {
  id: string;
  orderId: string;
  periodNo: number;
  dueDate: string;
  planAmount: number;
  actualAmount: number;
  deductedAmount: number;
  status: InstallmentStatus;
  contentDeliveredAt?: string;
};

type OrderRecord = {
  id: string;
  studentId: string;
  courseId: string;
  orgId: string;
  attributedStaffId?: string;
  totalAmount: number;
  periodCount: number;
  periodAmount: number;
  status: OrderStatus;
  coolingOffDeadline?: string;
  createdAt: string;
  installmentItems: InstallmentRecord[];
};

type CommissionRecord = {
  id: string;
  staffId: string;
  orderId: string;
  type: CommissionType;
  periodNo?: number;
  amount: number;
  status: CommissionStatus;
  createdAt: string;
};

type ReferralRewardRecord = {
  id: string;
  studentId: string;
  inviteeStudentId: string;
  orderId: string;
  netAmount: number;
  status: "PENDING" | "PAID";
  createdAt: string;
};

type CheckinRecord = {
  id: string;
  orderId: string;
  coursePeriod: number;
  matched: boolean;
  createdAt: string;
};

type IncentiveRecord = {
  id: string;
  orderId: string;
  amount: number;
  createdAt: string;
};

type MockState = {
  scenario: ScenarioName;
  currentStudentId: string;
  config: {
    priceCap: number;
    zhimaEnabled: boolean;
  };
  metrics: {
    repaymentRate: number;
    overdueRate: number;
    refundRate: number;
  };
  orgs: OrgRecord[];
  courses: CourseRecord[];
  students: StudentRecord[];
  staff: StaffRecord[];
  orders: OrderRecord[];
  commissions: CommissionRecord[];
  referralRewards: ReferralRewardRecord[];
  checkins: CheckinRecord[];
  incentives: IncentiveRecord[];
  qaQuestions: QaQuestionRecord[];
  nextId: number;
};

type PersistedMockStore = {
  version: number;
  savedAt: string;
  state: MockState;
  sessions: Session[];
};

const scenarioLabels: Record<ScenarioName, string> = {
  default: "混合履约场景",
  "new-user": "新学员首登场景",
  risk: "高风险逾期场景",
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const now = () => new Date().toISOString();

const plusDays = (base: string, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

@Injectable()
export class MockApiStateService {
  private readonly logger = new Logger(MockApiStateService.name);
  private readonly stateFilePath = this.resolveStateFilePath();
  private state = this.createScenarioState("default");
  private readonly sessions = new Map<string, Session>();

  constructor() {
    if (!this.isEnabled()) {
      return;
    }

    this.hydrateStore();
  }

  isEnabled() {
    return process.env.MOCK_API === "true";
  }

  private shouldBypassAuth() {
    return this.isEnabled() && process.env.MOCK_API_BYPASS_AUTH !== "false";
  }

  handle(req: Request): MockResponse | null {
    if (!this.isEnabled()) {
      return null;
    }

    const path = (req.originalUrl || req.url || req.path).split("?")[0];
    const method = req.method.toUpperCase();

    if (!path.startsWith("/api/v1/")) {
      return null;
    }

    try {
      const data = this.dispatch(method, path, req);
      if (typeof data === "undefined") {
        return null;
      }

      return {
        handled: true,
        status: 200,
        message: "success",
        data,
      };
    } catch (error) {
      return {
        handled: true,
        status: (error as Error & { status?: number }).status || 400,
        message: (error as Error).message || "mock api error",
        data: null,
      };
    }
  }

  private dispatch(method: string, path: string, req: Request) {
    if (method === "GET" && path === "/api/v1/mock/scenarios") {
      return {
        current: this.state.scenario,
        scenarios: Object.entries(scenarioLabels).map(([key, label]) => ({
          key,
          label,
        })),
      };
    }

    if (method === "POST" && path === "/api/v1/mock/scenario") {
      const scenario = String(req.body?.scenario || "default") as ScenarioName;
      this.reset(scenario);
      return {
        current: this.state.scenario,
        summary: this.getSummary(),
      };
    }

    if (method === "POST" && path === "/api/v1/mock/reset") {
      this.reset(this.state.scenario);
      return {
        current: this.state.scenario,
        summary: this.getSummary(),
      };
    }

    if (method === "GET" && path === "/api/v1/mock/summary") {
      return this.getSummary();
    }

    if (method === "POST" && path === "/api/v1/auth/admin/login") {
      return this.loginAdmin(req.body);
    }

    if (method === "POST" && path === "/api/v1/auth/org/login") {
      return this.loginOrg(req.body);
    }

    if (method === "POST" && path === "/api/v1/auth/wechat/login") {
      return this.loginApp(req.body, "wechat");
    }

    if (method === "POST" && path === "/api/v1/auth/alipay/login") {
      return this.loginApp(req.body, "alipay");
    }

    if (method === "GET" && path === "/api/v1/admin/orgs") {
      this.requireRole(req, "admin");
      return {
        items: this.state.orgs.map((org) => ({
          ...clone(org),
          gmv: this.getOrgGmv(org.id),
          platformServiceFee: this.getOrgServiceFee(org.id),
        })),
        total: this.state.orgs.length,
      };
    }

    if (method === "GET" && path === "/api/v1/admin/staff") {
      this.requireRole(req, "admin");
      const items = this.state.staff.map((staff) => this.toAdminStaff(staff));
      return {
        items,
        total: items.length,
      };
    }

    const approveMatch = path.match(
      /^\/api\/v1\/admin\/orgs\/([^/]+)\/approve$/,
    );
    if (method === "POST" && approveMatch) {
      this.requireRole(req, "admin");
      const org = this.getOrgById(approveMatch[1]);
      org.status = "ACTIVE";
      org.settlementFeeRate = Number(
        req.body?.feeRate || org.settlementFeeRate,
      );
      org.depositBalance = org.depositBalance || 500000;
      this.persistStore();
      return clone(org);
    }

    const suspendMatch = path.match(
      /^\/api\/v1\/admin\/orgs\/([^/]+)\/suspend$/,
    );
    if (method === "POST" && suspendMatch) {
      this.requireRole(req, "admin");
      const org = this.getOrgById(suspendMatch[1]);
      org.status = "SUSPENDED";
      this.persistStore();
      return {
        ...clone(org),
        reason: String(req.body?.reason || "mock suspend"),
      };
    }

    const disableStaffMatch = path.match(
      /^\/api\/v1\/admin\/staff\/([^/]+)\/disable$/,
    );
    if (method === "POST" && disableStaffMatch) {
      this.requireRole(req, "admin");
      const staff = this.getStaffById(disableStaffMatch[1]);
      staff.status = "DISABLED";
      this.persistStore();
      return this.toAdminStaff(staff);
    }

    if (method === "GET" && path === "/api/v1/admin/report/health") {
      this.requireRole(req, "admin");
      return this.getHealthMetrics();
    }

    if (method === "GET" && path === "/api/v1/admin/report/gmv") {
      this.requireRole(req, "admin");
      const period = String(
        req.query.period || new Date().toISOString().slice(0, 7),
      );
      return this.getGmvReport(period);
    }

    if (method === "PUT" && path === "/api/v1/admin/config/price-cap") {
      this.requireRole(req, "admin");
      this.state.config.priceCap = Number(
        req.body?.cap || this.state.config.priceCap,
      );
      this.persistStore();
      return clone(this.state.config);
    }

    if (method === "PUT" && path === "/api/v1/admin/config/credit") {
      this.requireRole(req, "admin");
      this.state.config.zhimaEnabled = Boolean(req.body?.zhimaEnabled);
      this.persistStore();
      return clone(this.state.config);
    }

    if (method === "GET" && path === "/api/v1/org/profile") {
      const session = this.requireRole(req, "org");
      return clone(this.getOrgById(session.actorId));
    }

    if (method === "GET" && path === "/api/v1/org/orders") {
      const session = this.requireRole(req, "org");
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const items = this.state.orders
        .filter((order) => order.orgId === session.actorId)
        .filter((order) => !status || order.status === status)
        .map((order) => this.toOrgOrder(order));
      return {
        items,
        total: items.length,
      };
    }

    const overdueMatch = path.match(
      /^\/api\/v1\/org\/overdue\/([^/]+)\/action$/,
    );
    if (method === "POST" && overdueMatch) {
      const session = this.requireRole(req, "org");
      const installment = this.findInstallment(overdueMatch[1]);
      const order = this.getOrderById(installment.orderId);
      if (order.orgId !== session.actorId) {
        this.fail(403, "无权处理该逾期记录");
      }
      installment.status =
        req.body?.action === "write_off" ? "WRITTEN_OFF" : installment.status;
      this.state.commissions
        .filter(
          (record) =>
            record.orderId === order.id && record.status === "PENDING",
        )
        .forEach((record) => {
          record.status = "HELD";
        });
      this.persistStore();
      return {
        id: installment.id,
        action: req.body?.action,
        remark: req.body?.remark,
        status: installment.status,
      };
    }

    if (method === "GET" && path === "/api/v1/org/settlement") {
      const session = this.requireRole(req, "org");
      return this.getSettlements(session.actorId);
    }

    if (method === "GET" && path === "/api/v1/org/qa") {
      const session = this.requireRole(req, "org");
      const replied =
        typeof req.query.replied === "string"
          ? req.query.replied === "true"
          : undefined;
      const items = this.state.qaQuestions
        .filter((item) => item.orgId === session.actorId)
        .filter((item) =>
          typeof replied === "boolean" ? item.replied === replied : true,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((item) => this.toOrgQaQuestion(item));
      return {
        items,
        total: items.length,
      };
    }

    const replyQaMatch = path.match(/^\/api\/v1\/org\/qa\/([^/]+)\/reply$/);
    if (method === "POST" && replyQaMatch) {
      const session = this.requireRole(req, "org");
      const question = this.getQaQuestionById(replyQaMatch[1]);
      if (question.orgId !== session.actorId) {
        this.fail(403, "无权回复该问题");
      }
      const reply = String(req.body?.reply || "").trim();
      if (!reply) {
        this.fail(400, "回复内容不能为空");
      }
      question.replied = true;
      question.reply = reply;
      question.repliedAt = now();
      this.persistStore();
      return this.toOrgQaQuestion(question);
    }

    if (method === "GET" && path === "/api/v1/org/deposit") {
      const session = this.requireRole(req, "org");
      const org = this.getOrgById(session.actorId);
      return { balance: org.depositBalance };
    }

    if (method === "POST" && path === "/api/v1/courses/org") {
      const session = this.requireRole(req, "org");
      const course: CourseRecord = {
        id: this.nextId("course"),
        orgId: session.actorId,
        title: String(req.body?.title || "未命名课程"),
        outline: String(req.body?.outline || "待补充课程大纲"),
        teacherInfo: String(req.body?.teacherInfo || "待补充讲师介绍"),
        price: Number(req.body?.price || 0),
        periodCount: Number(req.body?.periodCount || 1),
        reviewPeriodDays: 180,
        status: "OFFLINE",
        createdAt: now(),
      };
      this.state.courses.unshift(course);
      this.persistStore();
      return clone(course);
    }

    const updateCourseMatch = path.match(/^\/api\/v1\/courses\/org\/([^/]+)$/);
    if (method === "PUT" && updateCourseMatch) {
      const session = this.requireRole(req, "org");
      const course = this.getCourseById(updateCourseMatch[1]);
      if (course.orgId !== session.actorId) {
        this.fail(403, "无权更新该课程");
      }
      Object.assign(course, req.body || {});
      this.persistStore();
      return clone(course);
    }

    if (method === "GET" && path === "/api/v1/courses") {
      const orgId =
        typeof req.query.orgId === "string" ? req.query.orgId : undefined;
      if (orgId) {
        const items = this.state.courses
          .filter((course) => course.orgId === orgId)
          .map((course) => this.toCourseWithOrg(course));
        return {
          items,
          total: items.length,
          page: 1,
          size: Number(req.query.size || items.length || 20),
          totalPages: 1,
        };
      }

      const keyword =
        typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
      const page = Number(req.query.page || 1);
      const size = Number(req.query.size || 20);
      const items = this.state.courses
        .filter((course) => course.status === "ONLINE")
        .filter(
          (course) =>
            !keyword ||
            course.title.includes(keyword) ||
            this.getOrgById(course.orgId).name.includes(keyword),
        )
        .map((course) => this.toCourseWithOrg(course));
      return {
        items: items.slice((page - 1) * size, page * size),
        total: items.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(items.length / size)),
      };
    }

    const courseDetailMatch = path.match(/^\/api\/v1\/courses\/([^/]+)$/);
    if (method === "GET" && courseDetailMatch) {
      return this.toCourseWithOrg(this.getCourseById(courseDetailMatch[1]));
    }

    if (method === "POST" && path === "/api/v1/users/realname") {
      const session = this.requireRole(req, "student");
      const student = this.getStudentById(session.actorId);
      const idNo = String(req.body?.idNo || "");
      if (!this.isAdult(idNo)) {
        this.fail(400, "未满 18 周岁不可报名分期课程");
      }
      student.realname = String(req.body?.name || student.realname);
      student.phone = String(req.body?.phone || student.phone);
      student.realnameVerified = true;
      student.ageVerifiedAdult = true;
      this.persistStore();
      return clone(student);
    }

    if (method === "POST" && path === "/api/v1/users/bind-phone") {
      const session = this.requireRole(req, "student");
      const student = this.getStudentById(session.actorId);
      student.phone = String(req.body?.phone || student.phone);
      this.persistStore();
      return clone(student);
    }

    if (method === "GET" && path === "/api/v1/users/profile") {
      const session = this.requireRole(req, "student");
      return clone(this.getStudentById(session.actorId));
    }

    if (method === "POST" && path === "/api/v1/orders") {
      const session = this.requireRole(req, "student");
      const student = this.getStudentById(session.actorId);
      const course = this.getCourseById(String(req.body?.courseId || ""));
      if (course.price > this.state.config.priceCap) {
        this.fail(400, "课程超出当前客单价上限");
      }
      const orderId = this.nextId("order");
      const periodAmount = Math.round(course.price / course.periodCount);
      const createdAt = now();
      const order: OrderRecord = {
        id: orderId,
        studentId: student.id,
        courseId: course.id,
        orgId: course.orgId,
        attributedStaffId: student.referrerStaffId,
        totalAmount: course.price,
        periodCount: course.periodCount,
        periodAmount,
        status: "CREATED",
        createdAt,
        installmentItems: Array.from({ length: course.periodCount }).map(
          (_, index) => ({
            id: this.nextId("installment"),
            orderId,
            periodNo: index + 1,
            dueDate: plusDays(createdAt, (index + 1) * 30),
            planAmount: periodAmount,
            actualAmount: periodAmount,
            deductedAmount: 0,
            status: "PENDING",
          }),
        ),
      };
      this.state.orders.unshift(order);
      if (student.referrerStaffId) {
        this.state.commissions.unshift({
          id: this.nextId("commission"),
          staffId: student.referrerStaffId,
          orderId,
          type: "CLOSING",
          amount: Math.round(course.price * 0.06),
          status: "PENDING",
          createdAt,
        });
      }
      this.persistStore();
      return clone(order);
    }

    if (method === "GET" && path === "/api/v1/orders") {
      const session = this.requireRole(req, "student");
      return this.state.orders
        .filter((order) => order.studentId === session.actorId)
        .map((order) => this.toStudentOrder(order));
    }

    const installmentsMatch = path.match(
      /^\/api\/v1\/orders\/([^/]+)\/installments$/,
    );
    if (method === "GET" && installmentsMatch) {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        installmentsMatch[1],
      );
      return clone(order.installmentItems);
    }

    const signOrderMatch = path.match(/^\/api\/v1\/orders\/([^/]+)\/sign$/);
    if (method === "POST" && signOrderMatch) {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(session.actorId, signOrderMatch[1]);
      order.status = "COOLING_OFF";
      order.coolingOffDeadline = plusDays(now(), 7);
      this.persistStore();
      return {
        id: order.id,
        status: order.status,
        signUrl: `https://mock-esign.wangke.com/order/${order.id}`,
      };
    }

    const refundOrderMatch = path.match(/^\/api\/v1\/orders\/([^/]+)\/refund$/);
    if (method === "POST" && refundOrderMatch) {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        refundOrderMatch[1],
      );
      order.status = "REFUNDED";
      this.state.commissions
        .filter((record) => record.orderId === order.id)
        .forEach((record) => {
          record.status = "CLAWED_BACK";
        });
      this.persistStore();
      return clone(this.toStudentOrder(order));
    }

    const orderDetailMatch = path.match(/^\/api\/v1\/orders\/([^/]+)$/);
    if (method === "GET" && orderDetailMatch) {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        orderDetailMatch[1],
      );
      return this.toStudentOrder(order);
    }

    if (method === "POST" && path === "/api/v1/credit/authorize") {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        String(req.body?.orderId || ""),
      );
      return {
        eligible: true,
        riskTier: this.state.scenario === "risk" ? "B" : "A",
        suggestedLimit: Math.max(order.totalAmount, 99900),
        provider: this.state.config.zhimaEnabled ? "zhima" : "builtin",
        providerRef: `credit-${order.id}`,
      };
    }

    if (method === "POST" && path === "/api/v1/credit/sign-agreement") {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        String(req.body?.orderId || ""),
      );
      return {
        orderId: order.id,
        agreementNo: `AGREE-${order.id}`,
        status: "SIGNED",
      };
    }

    const learningProgressMatch = path.match(
      /^\/api\/v1\/learning\/([^/]+)\/progress$/,
    );
    if (method === "GET" && learningProgressMatch) {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        learningProgressMatch[1],
      );
      return {
        installments: clone(order.installmentItems),
        checkins: clone(
          this.state.checkins.filter((item) => item.orderId === order.id),
        ),
        incentives: clone(
          this.state.incentives.filter((item) => item.orderId === order.id),
        ),
      };
    }

    if (method === "POST" && path === "/api/v1/learning/checkin") {
      const session = this.requireRole(req, "student");
      const order = this.assertStudentOrder(
        session.actorId,
        String(req.body?.orderId || ""),
      );
      const matched = !String(req.body?.faceToken || "").includes("fail");
      const createdAt = now();
      this.state.checkins.push({
        id: this.nextId("checkin"),
        orderId: order.id,
        coursePeriod: Number(req.body?.coursePeriod || 1),
        matched,
        createdAt,
      });
      if (matched) {
        this.state.incentives.push({
          id: this.nextId("incentive"),
          orderId: order.id,
          amount: 500,
          createdAt,
        });
      }
      this.persistStore();
      return {
        matched,
        incentiveAmount: matched ? 500 : 0,
      };
    }

    if (method === "POST" && path === "/api/v1/referral/invite") {
      const session = this.requireRole(req, "student");
      return {
        link: `https://mp.wangke.com/register?inv=${session.actorId}`,
      };
    }

    if (method === "GET" && path === "/api/v1/referral/rewards") {
      const session = this.requireRole(req, "student");
      return this.state.referralRewards
        .filter((item) => item.studentId === session.actorId)
        .map(clone);
    }

    if (method === "GET" && path === "/api/v1/staff/commission") {
      const session = this.requireRole(req, "staff");
      return this.getStaffDashboard(session.actorId);
    }

    if (method === "GET" && path === "/api/v1/staff/students") {
      const session = this.requireRole(req, "staff");
      const page = Number(req.query.page || 1);
      const items = this.state.students
        .filter((student) => student.referrerStaffId === session.actorId)
        .map((student) => ({
          id: student.id,
          realname: this.maskName(student.realname),
          phone: this.maskPhone(student.phone),
          orders: this.state.orders
            .filter((order) => order.studentId === student.id)
            .map((order) => ({ id: order.id, status: order.status })),
        }));
      return {
        items,
        total: items.length,
        page,
      };
    }

    if (method === "GET" && path === "/api/v1/staff/profile") {
      const session = this.requireRole(req, "staff");
      return clone(this.getStaffById(session.actorId));
    }

    return undefined;
  }

  private loginAdmin(body: any) {
    const username = String(body?.username || "");
    const password = String(body?.password || "");
    if (!username || !password) {
      this.fail(401, "账号或密码错误");
    }
    const token = this.issueSession("admin", username, "admin");
    return {
      token,
      role: "PLATFORM_ADMIN",
      username,
    };
  }

  private loginOrg(body: any) {
    const phone = String(body?.phone || "");
    const password = String(body?.password || "");
    const org =
      this.state.orgs.find((item) => item.phone === phone) ||
      this.state.orgs.find((item) => item.status === "ACTIVE");
    if (!org || !password) {
      this.fail(401, "账号或密码错误");
    }
    const token = this.issueSession("org", org.id, "org");
    return {
      token,
      orgId: org.id,
      orgName: org.name,
    };
  }

  private loginApp(body: any, provider: "wechat" | "alipay") {
    if (body?.appType === "staff") {
      const staff = this.getStaffById("staff-demo-001");
      const token = this.issueSession("staff", staff.id, "staff");
      return {
        token,
        staff,
        provider,
        isNew: false,
      };
    }

    const student = this.getStudentById(this.state.currentStudentId);
    const token = this.issueSession("student", student.id, "student");
    return {
      token,
      student,
      provider,
      isNew: !student.realnameVerified,
    };
  }

  private getSummary() {
    return {
      scenario: this.state.scenario,
      currentStudentId: this.state.currentStudentId,
      orgCount: this.state.orgs.length,
      courseCount: this.state.courses.length,
      orderCount: this.state.orders.length,
      overdueInstallmentCount: this.state.orders
        .flatMap((order) => order.installmentItems)
        .filter((item) => item.status === "OVERDUE").length,
    };
  }

  private getHealthMetrics() {
    return {
      totalGmv: this.state.orders
        .filter((order) => order.status !== "REFUNDED")
        .reduce((sum, order) => sum + order.totalAmount, 0),
      activeOrderCount: this.state.orders.filter(
        (order) => order.status === "ACTIVE",
      ).length,
      repaymentRate: this.state.metrics.repaymentRate,
      overdueRate: this.state.metrics.overdueRate,
      refundRate: this.state.metrics.refundRate,
      healthStatus: {
        repaymentRate:
          this.state.metrics.repaymentRate >= 92 ? "healthy" : "warning",
        overdueRate:
          this.state.metrics.overdueRate <= 10 ? "healthy" : "warning",
        refundRate: this.state.metrics.refundRate <= 5 ? "healthy" : "warning",
      },
    };
  }

  private getGmvReport(period: string) {
    const orgs = this.state.orgs
      .filter((org) => org.status !== "EXITED")
      .map((org) => {
        const orders = this.state.orders.filter(
          (order) =>
            order.orgId === org.id && order.createdAt.startsWith(period),
        );
        const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        return {
          id: org.id,
          orgName: org.name,
          gmv,
          platformServiceFee: Math.round(gmv * org.settlementFeeRate),
          status: org.status,
        };
      });

    return {
      period,
      totalGmv: orgs.reduce((sum, item) => sum + item.gmv, 0),
      totalFee: orgs.reduce((sum, item) => sum + item.platformServiceFee, 0),
      orgs,
    };
  }

  private getSettlements(orgId: string) {
    const org = this.getOrgById(orgId);
    const grouped = new Map<string, number>();
    this.state.orders
      .filter((order) => order.orgId === orgId)
      .forEach((order) => {
        const period = order.createdAt.slice(0, 7);
        grouped.set(
          period,
          (grouped.get(period) || 0) +
            (order.status === "REFUNDED" ? 0 : order.totalAmount),
        );
      });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([period, gmv]) => ({
        id: `settlement-${orgId}-${period}`,
        period,
        gmv,
        platformServiceFee: Math.round(gmv * org.settlementFeeRate),
        status:
          period < new Date().toISOString().slice(0, 7) ? "SETTLED" : "PENDING",
      }));
  }

  private getStaffDashboard(staffId: string) {
    const records = this.state.commissions
      .filter((record) => record.staffId === staffId)
      .map((record) => {
        const order = this.getOrderById(record.orderId);
        const course = this.getCourseById(order.courseId);
        const student = this.getStudentById(order.studentId);
        return {
          ...clone(record),
          courseTitle: course.title,
          studentName: this.maskName(student.realname),
        };
      });

    return {
      settled: records
        .filter((record) => record.status === "SETTLED")
        .reduce((sum, record) => sum + record.amount, 0),
      pending: records
        .filter((record) => record.status === "PENDING")
        .reduce((sum, record) => sum + record.amount, 0),
      held: records
        .filter((record) => record.status === "HELD")
        .reduce((sum, record) => sum + record.amount, 0),
      records,
    };
  }

  private toAdminStaff(staff: StaffRecord) {
    const studentCount = this.state.students.filter(
      (student) => student.referrerStaffId === staff.id,
    ).length;
    const commissionTotal = this.state.commissions
      .filter(
        (record) =>
          record.staffId === staff.id && record.status !== "CLAWED_BACK",
      )
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      ...clone(staff),
      studentCount,
      commissionTotal,
    };
  }

  private toOrgQaQuestion(question: QaQuestionRecord) {
    const student = this.getStudentById(question.studentId);
    return {
      id: question.id,
      student: this.maskName(student.realname),
      question: question.question,
      createdAt: question.createdAt.slice(0, 10),
      replied: question.replied,
      reply: question.reply,
      repliedAt: question.repliedAt,
    };
  }

  private toOrgOrder(order: OrderRecord) {
    const student = this.getStudentById(order.studentId);
    const course = this.getCourseById(order.courseId);
    return {
      id: order.id,
      totalAmount: order.totalAmount,
      periodCount: order.periodCount,
      status: order.status,
      createdAt: order.createdAt,
      student: {
        id: student.id,
        realname: student.realname,
        phone: student.phone,
      },
      course: {
        id: course.id,
        title: course.title,
      },
      installmentItems: clone(order.installmentItems),
    };
  }

  private toStudentOrder(order: OrderRecord) {
    const course = this.getCourseById(order.courseId);
    const org = this.getOrgById(order.orgId);
    return {
      id: order.id,
      totalAmount: order.totalAmount,
      periodCount: order.periodCount,
      periodAmount: order.periodAmount,
      status: order.status,
      createdAt: order.createdAt,
      coolingOffDeadline: order.coolingOffDeadline,
      course: {
        id: course.id,
        title: course.title,
      },
      sellerOrg: {
        id: org.id,
        name: org.name,
      },
      installmentItems: clone(order.installmentItems),
    };
  }

  private toCourseWithOrg(course: CourseRecord) {
    const org = this.getOrgById(course.orgId);
    return {
      ...clone(course),
      org: {
        id: org.id,
        name: org.name,
      },
    };
  }

  private issueSession(actorType: ActorType, actorId: string, role: string) {
    const token = `mock-${actorType}-${actorId}-${Date.now()}`;
    this.sessions.set(token, { token, actorType, actorId, role });
    this.persistStore();
    return token;
  }

  private getSession(req: Request) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    return this.sessions.get(token) || null;
  }

  private requireRole(req: Request, role: ActorType) {
    const session = this.getSession(req);
    if (session?.actorType === role) {
      return session;
    }

    if (this.shouldBypassAuth()) {
      return this.createBypassSession(role);
    }

    this.fail(401, "登录态无效或已过期");
  }

  private createBypassSession(role: ActorType): Session {
    return {
      token: `mock-bypass-${role}`,
      actorType: role,
      actorId: this.getBypassActorId(role),
      role,
    };
  }

  private getBypassActorId(role: ActorType) {
    if (role === "admin") {
      return "admin";
    }

    if (role === "org") {
      return (
        this.state.orgs.find((item) => item.status === "ACTIVE")?.id ||
        "org-active-001"
      );
    }

    if (role === "staff") {
      return (
        this.state.staff.find((item) => item.status === "ACTIVE")?.id ||
        "staff-demo-001"
      );
    }

    return this.state.currentStudentId;
  }

  private getOrgById(id: string) {
    const org = this.state.orgs.find((item) => item.id === id);
    if (!org) {
      this.fail(404, "机构不存在");
    }
    return org;
  }

  private getCourseById(id: string) {
    const course = this.state.courses.find((item) => item.id === id);
    if (!course) {
      this.fail(404, "课程不存在");
    }
    return course;
  }

  private getStudentById(id: string) {
    const student = this.state.students.find((item) => item.id === id);
    if (!student) {
      this.fail(404, "学员不存在");
    }
    return student;
  }

  private getStaffById(id: string) {
    const staff = this.state.staff.find((item) => item.id === id);
    if (!staff) {
      this.fail(404, "业务员不存在");
    }
    return staff;
  }

  private getQaQuestionById(id: string) {
    const question = this.state.qaQuestions.find((item) => item.id === id);
    if (!question) {
      this.fail(404, "答疑问题不存在");
    }
    return question;
  }

  private getOrderById(id: string) {
    const order = this.state.orders.find((item) => item.id === id);
    if (!order) {
      this.fail(404, "订单不存在");
    }
    return order;
  }

  private assertStudentOrder(studentId: string, orderId: string) {
    const order = this.getOrderById(orderId);
    if (order.studentId !== studentId) {
      this.fail(403, "无权访问该订单");
    }
    return order;
  }

  private findInstallment(id: string) {
    const installment = this.state.orders
      .flatMap((order) => order.installmentItems)
      .find((item) => item.id === id);
    if (!installment) {
      this.fail(404, "分期记录不存在");
    }
    return installment;
  }

  private getOrgGmv(orgId: string) {
    return this.state.orders
      .filter((order) => order.orgId === orgId && order.status !== "REFUNDED")
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }

  private getOrgServiceFee(orgId: string) {
    const org = this.getOrgById(orgId);
    return Math.round(this.getOrgGmv(orgId) * org.settlementFeeRate);
  }

  private nextId(prefix: string) {
    this.state.nextId += 1;
    return `${prefix}-${this.state.nextId}`;
  }

  private isAdult(idNo: string) {
    if (!/^\d{17}[\dXx]$/.test(idNo)) {
      return false;
    }
    const birth = idNo.slice(6, 14);
    const year = Number(birth.slice(0, 4));
    const month = Number(birth.slice(4, 6)) - 1;
    const day = Number(birth.slice(6, 8));
    const birthDate = new Date(year, month, day);
    const adultDate = new Date(birthDate);
    adultDate.setFullYear(adultDate.getFullYear() + 18);
    return adultDate <= new Date();
  }

  private maskName(value: string) {
    if (!value) {
      return value;
    }
    return value.length <= 1 ? `${value}*` : `${value.slice(0, 1)}*`;
  }

  private maskPhone(value: string) {
    if (!value || value.length < 7) {
      return value;
    }
    return `${value.slice(0, 3)}****${value.slice(-4)}`;
  }

  private fail(status: number, message: string): never {
    const error = new Error(message) as Error & { status?: number };
    error.status = status;
    throw error;
  }

  private reset(scenario: ScenarioName) {
    if (!(scenario in scenarioLabels)) {
      this.fail(400, "未知 mock 场景");
    }
    this.state = this.createScenarioState(scenario);
    this.sessions.clear();
    this.persistStore();
  }

  private hydrateStore() {
    if (!existsSync(this.stateFilePath)) {
      this.persistStore();
      return;
    }

    try {
      const raw = readFileSync(this.stateFilePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedMockStore>;

      if (!parsed.state || !Array.isArray(parsed.sessions)) {
        throw new Error("mock 持久化文件结构无效");
      }

      this.state = parsed.state as MockState;
      this.sessions.clear();
      parsed.sessions.forEach((session) => {
        if (session?.token) {
          this.sessions.set(session.token, session as Session);
        }
      });
      this.logger.log(`Loaded persisted mock state from ${this.stateFilePath}`);
    } catch (error) {
      this.logger.warn(
        `Failed to load persisted mock state, fallback to defaults: ${(error as Error).message}`,
      );
      this.state = this.createScenarioState("default");
      this.sessions.clear();
      this.persistStore();
    }
  }

  private persistStore() {
    if (!this.isEnabled()) {
      return;
    }

    const payload: PersistedMockStore = {
      version: 1,
      savedAt: now(),
      state: this.state,
      sessions: Array.from(this.sessions.values()),
    };

    try {
      mkdirSync(path.dirname(this.stateFilePath), { recursive: true });
      writeFileSync(
        this.stateFilePath,
        JSON.stringify(payload, null, 2),
        "utf-8",
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist mock state: ${(error as Error).message}`,
      );
    }
  }

  private resolveStateFilePath() {
    if (process.env.MOCK_API_STATE_FILE) {
      return path.isAbsolute(process.env.MOCK_API_STATE_FILE)
        ? process.env.MOCK_API_STATE_FILE
        : path.resolve(process.cwd(), process.env.MOCK_API_STATE_FILE);
    }

    return path.resolve(
      __dirname,
      "..",
      "..",
      "mock-data",
      "mock-api-state.json",
    );
  }

  private createScenarioState(scenario: ScenarioName): MockState {
    const defaultState = this.buildDefaultState();
    if (scenario === "new-user") {
      defaultState.scenario = "new-user";
      defaultState.currentStudentId = "student-new-001";
      defaultState.metrics = {
        repaymentRate: 94.2,
        overdueRate: 6.4,
        refundRate: 2.8,
      };
      return defaultState;
    }

    if (scenario === "risk") {
      defaultState.scenario = "risk";
      defaultState.currentStudentId = "student-risk-001";
      defaultState.metrics = {
        repaymentRate: 84.5,
        overdueRate: 16.8,
        refundRate: 7.6,
      };
      const order = defaultState.orders.find(
        (item) => item.id === "order-risk-001",
      );
      if (order) {
        order.status = "ACTIVE";
        order.installmentItems = order.installmentItems.map((item, index) => ({
          ...item,
          status: index === 0 ? "PAID" : index < 4 ? "OVERDUE" : "DELIVERED",
        }));
      }
      const org = defaultState.orgs.find(
        (item) => item.id === "org-active-002",
      );
      if (org) {
        org.status = "SUSPENDED";
      }
      return defaultState;
    }

    return defaultState;
  }

  private buildDefaultState(): MockState {
    const priceCap = 300000;
    const zhimaEnabled = false;
    const staffId = "staff-demo-001";

    const orgs: OrgRecord[] = [
      {
        id: "org-pending-001",
        name: "星火职训中心",
        phone: "18827666284",
        password: "Admin123",
        unifiedCreditCode: "91330100MOCKPENDING1",
        settlementFeeRate: 0.035,
        depositBalance: 300000,
        status: "PENDING",
      },
      {
        id: "org-active-001",
        name: "青禾设计学院",
        phone: "18827666283",
        password: "Admin123",
        unifiedCreditCode: "91330100MOCKACTIVE01",
        settlementFeeRate: 0.03,
        depositBalance: 800000,
        status: "ACTIVE",
      },
      {
        id: "org-active-002",
        name: "知行电商学堂",
        phone: "18827666285",
        password: "Admin123",
        unifiedCreditCode: "91330100MOCKACTIVE02",
        settlementFeeRate: 0.028,
        depositBalance: 650000,
        status: "ACTIVE",
      },
      {
        id: "org-suspended-001",
        name: "远航短视频训练营",
        phone: "18827666286",
        password: "Admin123",
        unifiedCreditCode: "91330100MOCKSUSPEND1",
        settlementFeeRate: 0.032,
        depositBalance: 180000,
        status: "SUSPENDED",
      },
      {
        id: "org-exited-001",
        name: "旧梦考证课堂",
        phone: "18827666287",
        password: "Admin123",
        unifiedCreditCode: "91330100MOCKEXITED01",
        settlementFeeRate: 0.03,
        depositBalance: 0,
        status: "EXITED",
      },
    ];

    const courses: CourseRecord[] = [
      {
        id: "course-ui-001",
        orgId: "org-active-001",
        title: "UI 设计商业实战营",
        outline: "从用户研究、信息架构到高保真交付，覆盖完整商业项目。",
        teacherInfo: "韩松，11 年设计负责人经验。",
        price: 198000,
        periodCount: 6,
        reviewPeriodDays: 180,
        status: "ONLINE",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "course-video-001",
        orgId: "org-active-001",
        title: "短视频剪辑增长课",
        outline: "账号定位、拍摄、剪辑、投流复盘一体化训练。",
        teacherInfo: "陈洛，擅长内容增长与账号孵化。",
        price: 128000,
        periodCount: 4,
        reviewPeriodDays: 180,
        status: "ONLINE",
        createdAt: "2026-04-12T10:00:00.000Z",
      },
      {
        id: "course-ai-001",
        orgId: "org-active-002",
        title: "AI 办公效率班",
        outline: "提示词、自动化、知识库、协作流程一次讲透。",
        teacherInfo: "顾言，企业数字化顾问。",
        price: 88000,
        periodCount: 3,
        reviewPeriodDays: 180,
        status: "ONLINE",
        createdAt: "2026-05-01T10:00:00.000Z",
      },
      {
        id: "course-offline-001",
        orgId: "org-active-001",
        title: "私域增长复盘营",
        outline: "围绕企微、直播和复购转化做系统复盘。",
        teacherInfo: "温宁，私域增长顾问。",
        price: 166000,
        periodCount: 5,
        reviewPeriodDays: 180,
        status: "OFFLINE",
        createdAt: "2026-05-10T10:00:00.000Z",
      },
    ];

    const students: StudentRecord[] = [
      {
        id: "student-main-001",
        phone: "13800138000",
        realname: "林一",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: staffId,
        createdAt: "2026-04-20T10:00:00.000Z",
      },
      {
        id: "student-new-001",
        phone: "",
        realname: "待实名学员",
        realnameVerified: false,
        ageVerifiedAdult: false,
        referrerStaffId: staffId,
        createdAt: "2026-06-02T10:00:00.000Z",
      },
      {
        id: "student-peer-001",
        phone: "13900139000",
        realname: "周岚",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: staffId,
        createdAt: "2026-03-11T10:00:00.000Z",
      },
      {
        id: "student-risk-001",
        phone: "13700137000",
        realname: "何意",
        realnameVerified: true,
        ageVerifiedAdult: true,
        referrerStaffId: staffId,
        createdAt: "2026-02-08T10:00:00.000Z",
      },
    ];

    const staff: StaffRecord[] = [
      {
        id: staffId,
        name: "张卓",
        phone: "13888880001",
        contractType: "AGENT",
        status: "ACTIVE",
        groupName: "华东增长组",
        commissionRate: 0.12,
      },
      {
        id: "staff-emp-002",
        name: "李敏",
        phone: "13988880002",
        contractType: "EMPLOYEE",
        status: "ACTIVE",
        groupName: "华南直营组",
        commissionRate: 0.08,
      },
      {
        id: "staff-agent-003",
        name: "周衡",
        phone: "13788880003",
        contractType: "AGENT",
        status: "DISABLED",
        groupName: "西南渠道组",
        commissionRate: 0.1,
      },
    ];

    const orders: OrderRecord[] = [
      {
        id: "order-created-001",
        studentId: "student-main-001",
        courseId: "course-video-001",
        orgId: "org-active-001",
        attributedStaffId: staffId,
        totalAmount: 128000,
        periodCount: 4,
        periodAmount: 32000,
        status: "CREATED",
        createdAt: "2026-06-02T10:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-created-001",
          4,
          32000,
          ["PENDING", "PENDING", "PENDING", "PENDING"],
          "2026-06-02T10:00:00.000Z",
        ),
      },
      {
        id: "order-cooling-001",
        studentId: "student-main-001",
        courseId: "course-ai-001",
        orgId: "org-active-002",
        attributedStaffId: staffId,
        totalAmount: 88000,
        periodCount: 3,
        periodAmount: 29333,
        status: "COOLING_OFF",
        coolingOffDeadline: "2026-06-08T23:59:59.000Z",
        createdAt: "2026-06-01T09:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-cooling-001",
          3,
          29333,
          ["PENDING", "PENDING", "PENDING"],
          "2026-06-01T09:00:00.000Z",
        ),
      },
      {
        id: "order-active-001",
        studentId: "student-main-001",
        courseId: "course-ui-001",
        orgId: "org-active-001",
        attributedStaffId: staffId,
        totalAmount: 198000,
        periodCount: 6,
        periodAmount: 33000,
        status: "ACTIVE",
        createdAt: "2026-05-03T10:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-active-001",
          6,
          33000,
          ["PAID", "DELIVERED", "OVERDUE", "PENDING", "PENDING", "PENDING"],
          "2026-05-03T10:00:00.000Z",
        ),
      },
      {
        id: "order-completed-001",
        studentId: "student-peer-001",
        courseId: "course-video-001",
        orgId: "org-active-001",
        attributedStaffId: staffId,
        totalAmount: 128000,
        periodCount: 4,
        periodAmount: 32000,
        status: "COMPLETED",
        createdAt: "2026-03-05T10:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-completed-001",
          4,
          32000,
          ["PAID", "PAID", "PAID", "PAID"],
          "2026-03-05T10:00:00.000Z",
        ),
      },
      {
        id: "order-refunded-001",
        studentId: "student-peer-001",
        courseId: "course-ai-001",
        orgId: "org-active-002",
        attributedStaffId: staffId,
        totalAmount: 88000,
        periodCount: 3,
        periodAmount: 29333,
        status: "REFUNDED",
        createdAt: "2026-04-18T10:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-refunded-001",
          3,
          29333,
          ["PENDING", "PENDING", "PENDING"],
          "2026-04-18T10:00:00.000Z",
        ),
      },
      {
        id: "order-risk-001",
        studentId: "student-risk-001",
        courseId: "course-ui-001",
        orgId: "org-active-001",
        attributedStaffId: staffId,
        totalAmount: 198000,
        periodCount: 6,
        periodAmount: 33000,
        status: "ACTIVE",
        createdAt: "2026-02-15T10:00:00.000Z",
        installmentItems: this.buildInstallments(
          "order-risk-001",
          6,
          33000,
          ["PAID", "OVERDUE", "OVERDUE", "DELIVERED", "PENDING", "PENDING"],
          "2026-02-15T10:00:00.000Z",
        ),
      },
    ];

    const commissions: CommissionRecord[] = [
      {
        id: "commission-001",
        staffId,
        orderId: "order-completed-001",
        type: "CLOSING",
        amount: 12000,
        status: "SETTLED",
        createdAt: "2026-03-06T10:00:00.000Z",
      },
      {
        id: "commission-002",
        staffId,
        orderId: "order-active-001",
        type: "PERFORMANCE",
        periodNo: 2,
        amount: 3200,
        status: "PENDING",
        createdAt: "2026-05-30T10:00:00.000Z",
      },
      {
        id: "commission-003",
        staffId,
        orderId: "order-risk-001",
        type: "PERFORMANCE",
        periodNo: 3,
        amount: 2800,
        status: "HELD",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "commission-004",
        staffId,
        orderId: "order-refunded-001",
        type: "CLOSING",
        amount: 5000,
        status: "CLAWED_BACK",
        createdAt: "2026-04-20T10:00:00.000Z",
      },
    ];

    const referralRewards: ReferralRewardRecord[] = [
      {
        id: "referral-001",
        studentId: "student-main-001",
        inviteeStudentId: "student-peer-001",
        orderId: "order-completed-001",
        netAmount: 4000,
        status: "PAID",
        createdAt: "2026-04-16T12:00:00.000Z",
      },
      {
        id: "referral-002",
        studentId: "student-main-001",
        inviteeStudentId: "student-risk-001",
        orderId: "order-risk-001",
        netAmount: 4000,
        status: "PENDING",
        createdAt: "2026-05-21T12:00:00.000Z",
      },
    ];

    const checkins: CheckinRecord[] = [
      {
        id: "checkin-001",
        orderId: "order-active-001",
        coursePeriod: 1,
        matched: true,
        createdAt: "2026-05-11T10:00:00.000Z",
      },
      {
        id: "checkin-002",
        orderId: "order-active-001",
        coursePeriod: 2,
        matched: false,
        createdAt: "2026-05-28T10:00:00.000Z",
      },
    ];

    const incentives: IncentiveRecord[] = [
      {
        id: "incentive-001",
        orderId: "order-active-001",
        amount: 500,
        createdAt: "2026-05-11T10:00:00.000Z",
      },
    ];

    const qaQuestions: QaQuestionRecord[] = [
      {
        id: "qa-001",
        orgId: "org-active-001",
        studentId: "student-main-001",
        question: "第二期课程预计什么时候开放回看？",
        createdAt: "2026-06-02T08:30:00.000Z",
        replied: false,
      },
      {
        id: "qa-002",
        orgId: "org-active-001",
        studentId: "student-peer-001",
        question: "如果我这周出差，作业提交时间能顺延吗？",
        createdAt: "2026-05-30T11:20:00.000Z",
        replied: true,
        reply: "可以，已帮你登记顺延 3 天，班主任会同步调整截止时间。",
        repliedAt: "2026-05-30T13:00:00.000Z",
      },
      {
        id: "qa-003",
        orgId: "org-active-002",
        studentId: "student-risk-001",
        question: "我逾期以后还能继续看后面的课程吗？",
        createdAt: "2026-06-01T16:00:00.000Z",
        replied: true,
        reply: "学习权益以机构通知为准，建议先联系班主任确认当前可学习章节。",
        repliedAt: "2026-06-01T17:10:00.000Z",
      },
    ];

    return {
      scenario: "default",
      currentStudentId: "student-main-001",
      config: {
        priceCap,
        zhimaEnabled,
      },
      metrics: {
        repaymentRate: 93.6,
        overdueRate: 8.4,
        refundRate: 3.1,
      },
      orgs,
      courses,
      students,
      staff,
      orders,
      commissions,
      referralRewards,
      checkins,
      incentives,
      qaQuestions,
      nextId: 1000,
    };
  }

  private buildInstallments(
    orderId: string,
    periodCount: number,
    actualAmount: number,
    statuses: InstallmentStatus[],
    createdAt: string,
  ) {
    return Array.from({ length: periodCount }).map((_, index) => ({
      id: `${orderId}-installment-${index + 1}`,
      orderId,
      periodNo: index + 1,
      dueDate: plusDays(createdAt, (index + 1) * 30),
      planAmount: actualAmount,
      actualAmount,
      deductedAmount: statuses[index] === "PAID" ? actualAmount : 0,
      status: statuses[index],
      contentDeliveredAt:
        statuses[index] === "PENDING"
          ? undefined
          : plusDays(createdAt, index * 20 + 5),
    }));
  }
}
