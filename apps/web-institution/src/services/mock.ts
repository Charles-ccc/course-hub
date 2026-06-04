type InstitutionCourse = {
  id: string;
  orgId: string;
  title: string;
  outline: string;
  teacherInfo: string;
  price: number;
  periodCount: number;
  status: "ONLINE" | "OFFLINE";
};

type InstitutionInstallment = {
  id: string;
  periodNo: number;
  actualAmount: number;
  dueDate: string;
  status: "PENDING" | "DELIVERED" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
};

type InstitutionOrder = {
  id: string;
  student: { id: string; realname: string; phone: string };
  course: { id: string; title: string };
  totalAmount: number;
  periodCount: number;
  status: "ACTIVE" | "COOLING_OFF" | "COMPLETED" | "REFUNDED" | "OVERDUE";
  createdAt: string;
  installmentItems: InstitutionInstallment[];
};

type InstitutionSettlement = {
  id: string;
  period: string;
  gmv: number;
  platformServiceFee: number;
  status: "PENDING" | "SETTLED";
};

type InstitutionQaQuestion = {
  id: string;
  student: string;
  question: string;
  createdAt: string;
  replied: boolean;
  reply?: string;
  repliedAt?: string;
};

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const mockInstitutionState: {
  org: { id: string; name: string; phone: string };
  courses: InstitutionCourse[];
  orders: InstitutionOrder[];
  settlements: InstitutionSettlement[];
  deposit: { balance: number };
  qaQuestions: InstitutionQaQuestion[];
} = {
  org: {
    id: "org-active-001",
    name: "青禾设计学院",
    phone: "18827666283",
  },
  courses: [
    {
      id: "course-ui-001",
      orgId: "org-active-001",
      title: "UI 设计商业实战营",
      outline: "从用户研究到高保真交付，覆盖完整商业项目。",
      teacherInfo: "讲师韩松，11 年 B 端与电商设计经验。",
      price: 198000,
      periodCount: 6,
      status: "ONLINE",
    },
    {
      id: "course-video-001",
      orgId: "org-active-001",
      title: "短视频剪辑增长课",
      outline: "账号定位、素材剪辑、投流复盘。",
      teacherInfo: "讲师陈洛，操盘过 20+ 账号增长。",
      price: 128000,
      periodCount: 4,
      status: "ONLINE",
    },
    {
      id: "course-ai-001",
      orgId: "org-active-001",
      title: "AI 办公效率班",
      outline: "提示词、自动化、团队知识库落地。",
      teacherInfo: "讲师顾言，企业数字化顾问。",
      price: 88000,
      periodCount: 3,
      status: "OFFLINE",
    },
  ],
  orders: [
    {
      id: "order-active-001",
      student: { id: "stu-001", realname: "林海", phone: "13800001234" },
      course: { id: "course-ui-001", title: "UI 设计商业实战营" },
      totalAmount: 198000,
      periodCount: 6,
      status: "ACTIVE",
      createdAt: "2026-05-01T10:00:00.000Z",
      installmentItems: [
        {
          id: "inst-active-001-1",
          periodNo: 1,
          actualAmount: 33000,
          dueDate: "2026-05-10T00:00:00.000Z",
          status: "PAID",
        },
        {
          id: "inst-active-001-2",
          periodNo: 2,
          actualAmount: 33000,
          dueDate: "2026-06-10T00:00:00.000Z",
          status: "DELIVERED",
        },
        {
          id: "inst-active-001-3",
          periodNo: 3,
          actualAmount: 33000,
          dueDate: "2026-05-25T00:00:00.000Z",
          status: "OVERDUE",
        },
      ],
    },
    {
      id: "order-cooling-001",
      student: { id: "stu-002", realname: "周岚", phone: "13900004567" },
      course: { id: "course-video-001", title: "短视频剪辑增长课" },
      totalAmount: 128000,
      periodCount: 4,
      status: "COOLING_OFF",
      createdAt: "2026-06-01T10:00:00.000Z",
      installmentItems: [],
    },
    {
      id: "order-completed-001",
      student: { id: "stu-003", realname: "高宁", phone: "13700007890" },
      course: { id: "course-video-001", title: "短视频剪辑增长课" },
      totalAmount: 128000,
      periodCount: 4,
      status: "COMPLETED",
      createdAt: "2026-03-01T10:00:00.000Z",
      installmentItems: [
        {
          id: "inst-completed-001-1",
          periodNo: 1,
          actualAmount: 32000,
          dueDate: "2026-03-10T00:00:00.000Z",
          status: "PAID",
        },
        {
          id: "inst-completed-001-2",
          periodNo: 2,
          actualAmount: 32000,
          dueDate: "2026-04-10T00:00:00.000Z",
          status: "PAID",
        },
      ],
    },
    {
      id: "order-refunded-001",
      student: { id: "stu-004", realname: "何意", phone: "13600001122" },
      course: { id: "course-ai-001", title: "AI 办公效率班" },
      totalAmount: 88000,
      periodCount: 3,
      status: "REFUNDED",
      createdAt: "2026-04-12T10:00:00.000Z",
      installmentItems: [],
    },
  ],
  settlements: [
    {
      id: "settlement-2026-04",
      period: "2026-04",
      gmv: 620000,
      platformServiceFee: 18600,
      status: "SETTLED",
    },
    {
      id: "settlement-2026-05",
      period: "2026-05",
      gmv: 780000,
      platformServiceFee: 23400,
      status: "SETTLED",
    },
    {
      id: "settlement-2026-06",
      period: "2026-06",
      gmv: 410000,
      platformServiceFee: 12300,
      status: "PENDING",
    },
  ],
  deposit: {
    balance: 520000,
  },
  qaQuestions: [
    {
      id: "qa-001",
      student: "林*",
      question: "第二期课程预计什么时候开放回看？",
      createdAt: "2026-06-02",
      replied: false,
    },
    {
      id: "qa-002",
      student: "周*",
      question: "如果我这周出差，作业提交时间能顺延吗？",
      createdAt: "2026-05-30",
      replied: true,
      reply: "可以，已帮你登记顺延 3 天，班主任会同步调整截止时间。",
      repliedAt: "2026-05-30T13:00:00.000Z",
    },
  ],
};

const filterOrders = (status?: string) =>
  mockInstitutionState.orders.filter(
    (order) => !status || order.status === status,
  );

export const mockOrgApi = {
  async login(phone: string, _password: string) {
    await wait();
    return {
      token: `mock-org-token-${phone}`,
      orgId: mockInstitutionState.org.id,
      orgName: mockInstitutionState.org.name,
    };
  },

  async getProfile() {
    await wait();
    return clone(mockInstitutionState.org);
  },

  async getOrders(params?: { status?: string; size?: number }) {
    await wait();
    const items = filterOrders(params?.status);
    return {
      items: clone(
        typeof params?.size === "number" ? items.slice(0, params.size) : items,
      ),
      total: items.length,
    };
  },

  async getQaList(params?: { replied?: boolean }) {
    await wait();
    const items = mockInstitutionState.qaQuestions.filter((item) =>
      typeof params?.replied === "boolean"
        ? item.replied === params.replied
        : true,
    );
    return {
      items: clone(items),
      total: items.length,
    };
  },

  async overdueAction(id: string, action: string, remark?: string) {
    await wait();
    for (const order of mockInstitutionState.orders) {
      const item = order.installmentItems.find(
        (installment) => installment.id === id,
      );
      if (!item) {
        continue;
      }

      if (action === "write_off") {
        item.status = "WRITTEN_OFF";
        order.status = "OVERDUE";
      }

      return {
        id,
        action,
        remark,
        status: item.status,
      };
    }

    throw new Error("逾期记录不存在");
  },

  async replyQa(id: string, reply: string) {
    await wait();
    const target = mockInstitutionState.qaQuestions.find(
      (item) => item.id === id,
    );
    if (!target) {
      throw new Error("答疑问题不存在");
    }
    if (!reply.trim()) {
      throw new Error("回复内容不能为空");
    }

    target.replied = true;
    target.reply = reply.trim();
    target.repliedAt = new Date().toISOString();
    return clone(target);
  },

  async getSettlement() {
    await wait();
    return clone(mockInstitutionState.settlements);
  },

  async getDeposit() {
    await wait();
    return clone(mockInstitutionState.deposit);
  },

  async createCourse(data: Partial<InstitutionCourse>) {
    await wait();
    const course: InstitutionCourse = {
      id: `course-created-${Date.now()}`,
      orgId: mockInstitutionState.org.id,
      title: data.title || "未命名课程",
      outline: data.outline || "待补充大纲",
      teacherInfo: data.teacherInfo || "待补充师资介绍",
      price: Number(data.price || 0),
      periodCount: Number(data.periodCount || 1),
      status: "OFFLINE",
    };

    mockInstitutionState.courses.unshift(course);
    return clone(course);
  },

  async updateCourse(id: string, data: Partial<InstitutionCourse>) {
    await wait();
    const target = mockInstitutionState.courses.find(
      (course) => course.id === id,
    );
    if (!target) {
      throw new Error("课程不存在");
    }

    Object.assign(target, data);
    return clone(target);
  },

  async getCourses(orgId: string) {
    await wait();
    const items = mockInstitutionState.courses.filter(
      (course) => course.orgId === orgId,
    );
    return {
      items: clone(items),
      total: items.length,
    };
  },
};
