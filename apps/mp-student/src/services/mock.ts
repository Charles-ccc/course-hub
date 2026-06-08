import Taro from "@tarojs/taro";

type StudentCourse = {
  id: string;
  title: string;
  outline: string;
  teacherInfo: string;
  price: number;
  periodCount: number;
  reviewPeriodDays: number;
  org: { id: string; name: string };
};

type StudentInstallment = {
  id: string;
  periodNo: number;
  dueDate: string;
  actualAmount: number;
  status: "PENDING" | "DELIVERED" | "PAID" | "OVERDUE";
  contentDeliveredAt?: string;
};

type StudentOrder = {
  id: string;
  status: "CREATED" | "COOLING_OFF" | "ACTIVE" | "COMPLETED" | "REFUNDED";
  totalAmount: number;
  periodCount: number;
  periodAmount: number;
  createdAt: string;
  coolingOffDeadline?: string;
  course: { id: string; title: string };
  sellerOrg: { id: string; name: string };
  installmentItems: StudentInstallment[];
};

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const now = () => new Date().toISOString();

const addDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const buildInstallments = (
  orderId: string,
  totalAmount: number,
  periodCount: number,
): StudentInstallment[] => {
  const actualAmount = Math.round(totalAmount / periodCount);
  return Array.from({ length: periodCount }).map((_, index) => ({
    id: `${orderId}-installment-${index + 1}`,
    periodNo: index + 1,
    dueDate: addDays((index + 1) * 30),
    actualAmount,
    status: "PENDING",
  }));
};

const mockStudentState: {
  profile: {
    id: string;
    phone: string;
    realname: string;
    realnameVerified: boolean;
    ageVerifiedAdult: boolean;
    referrerStaffId?: string;
    referrerStudentId?: string;
  };
  courses: StudentCourse[];
  orders: StudentOrder[];
  checkins: Record<string, any[]>;
  incentives: Record<string, any[]>;
  referralRewards: any[];
} = {
  profile: {
    id: "stu-demo-001",
    phone: "",
    realname: "未实名学员",
    realnameVerified: false,
    ageVerifiedAdult: false,
    referrerStaffId: Taro.getStorageSync("referrerStaffId") || undefined,
    referrerStudentId: Taro.getStorageSync("referrerStudentId") || undefined,
  },
  courses: [
    {
      id: "course-ui-001",
      title: "UI 设计商业实战营",
      outline: "从用户研究到设计系统，覆盖真实商业项目的完整交付。",
      teacherInfo: "韩松，11 年 B 端与电商设计经验，带过 300+ 学员项目。",
      price: 198000,
      periodCount: 6,
      reviewPeriodDays: 180,
      org: { id: "org-active-001", name: "青禾设计学院" },
    },
    {
      id: "course-video-001",
      title: "短视频剪辑增长课",
      outline: "账号定位、脚本、剪辑、投流复盘一体化训练。",
      teacherInfo: "陈洛，操盘过多条百万播放账号。",
      price: 128000,
      periodCount: 4,
      reviewPeriodDays: 180,
      org: { id: "org-active-001", name: "青禾设计学院" },
    },
    {
      id: "course-ai-001",
      title: "AI 办公效率班",
      outline: "提示词、自动化、知识库、协同写作全流程。",
      teacherInfo: "顾言，企业数字化顾问。",
      price: 88000,
      periodCount: 3,
      reviewPeriodDays: 180,
      org: { id: "org-active-002", name: "知行电商学堂" },
    },
  ],
  orders: [
    {
      id: "stu-order-active-001",
      status: "ACTIVE",
      totalAmount: 198000,
      periodCount: 6,
      periodAmount: 33000,
      createdAt: "2026-04-20T10:00:00.000Z",
      course: { id: "course-ui-001", title: "UI 设计商业实战营" },
      sellerOrg: { id: "org-active-001", name: "青禾设计学院" },
      installmentItems: [
        {
          id: "stu-order-active-001-installment-1",
          periodNo: 1,
          dueDate: "2026-05-10T00:00:00.000Z",
          actualAmount: 33000,
          status: "PAID",
          contentDeliveredAt: "2026-05-01T00:00:00.000Z",
        },
        {
          id: "stu-order-active-001-installment-2",
          periodNo: 2,
          dueDate: "2026-06-10T00:00:00.000Z",
          actualAmount: 33000,
          status: "DELIVERED",
          contentDeliveredAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "stu-order-active-001-installment-3",
          periodNo: 3,
          dueDate: "2026-05-28T00:00:00.000Z",
          actualAmount: 33000,
          status: "OVERDUE",
          contentDeliveredAt: "2026-05-20T00:00:00.000Z",
        },
      ],
    },
    {
      id: "stu-order-cooling-001",
      status: "COOLING_OFF",
      totalAmount: 128000,
      periodCount: 4,
      periodAmount: 32000,
      createdAt: "2026-06-01T10:00:00.000Z",
      coolingOffDeadline: addDays(5),
      course: { id: "course-video-001", title: "短视频剪辑增长课" },
      sellerOrg: { id: "org-active-001", name: "青禾设计学院" },
      installmentItems: [],
    },
    {
      id: "stu-order-completed-001",
      status: "COMPLETED",
      totalAmount: 88000,
      periodCount: 3,
      periodAmount: 29333,
      createdAt: "2026-02-03T10:00:00.000Z",
      course: { id: "course-ai-001", title: "AI 办公效率班" },
      sellerOrg: { id: "org-active-002", name: "知行电商学堂" },
      installmentItems: [
        {
          id: "stu-order-completed-001-installment-1",
          periodNo: 1,
          dueDate: "2026-02-15T00:00:00.000Z",
          actualAmount: 29333,
          status: "PAID",
          contentDeliveredAt: "2026-02-05T00:00:00.000Z",
        },
        {
          id: "stu-order-completed-001-installment-2",
          periodNo: 2,
          dueDate: "2026-03-15T00:00:00.000Z",
          actualAmount: 29333,
          status: "PAID",
          contentDeliveredAt: "2026-03-05T00:00:00.000Z",
        },
      ],
    },
    {
      id: "stu-order-refunded-001",
      status: "REFUNDED",
      totalAmount: 128000,
      periodCount: 4,
      periodAmount: 32000,
      createdAt: "2026-03-18T10:00:00.000Z",
      course: { id: "course-video-001", title: "短视频剪辑增长课" },
      sellerOrg: { id: "org-active-001", name: "青禾设计学院" },
      installmentItems: [],
    },
  ],
  checkins: {
    "stu-order-active-001": [
      {
        id: "checkin-001",
        matched: true,
        createdAt: "2026-05-02T09:00:00.000Z",
      },
      {
        id: "checkin-002",
        matched: false,
        createdAt: "2026-05-08T09:00:00.000Z",
      },
    ],
  },
  incentives: {
    "stu-order-active-001": [
      {
        id: "incentive-001",
        amount: 500,
        createdAt: "2026-05-02T09:00:00.000Z",
      },
      {
        id: "incentive-002",
        amount: 800,
        createdAt: "2026-05-12T09:00:00.000Z",
      },
    ],
  },
  referralRewards: [
    {
      id: "reward-001",
      createdAt: "2026-05-20T10:00:00.000Z",
      netAmount: 4000,
      status: "PAID",
    },
    {
      id: "reward-002",
      createdAt: "2026-05-28T10:00:00.000Z",
      netAmount: 4000,
      status: "PENDING",
    },
    {
      id: "reward-003",
      createdAt: "2026-06-01T10:00:00.000Z",
      netAmount: 2500,
      status: "PENDING",
    },
  ],
};

const getAgeFromIdNo = (idNo: string) => {
  if (idNo.length < 14) {
    return 0;
  }

  const birth = idNo.slice(6, 14);
  const year = Number(birth.slice(0, 4));
  const month = Number(birth.slice(4, 6)) - 1;
  const day = Number(birth.slice(6, 8));
  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

export const mockStudentApi = {
  async wechatLogin(
    code: string,
    referrerStaffId?: string,
    referrerStudentId?: string,
  ) {
    await wait();
    mockStudentState.profile.referrerStaffId =
      referrerStaffId || mockStudentState.profile.referrerStaffId;
    mockStudentState.profile.referrerStudentId =
      referrerStudentId || mockStudentState.profile.referrerStudentId;
    return {
      token: `mock-student-token-${code}`,
      student: clone(mockStudentState.profile),
      isNew: !mockStudentState.profile.realnameVerified,
    };
  },

  async alipayLogin(
    authCode: string,
    referrerStaffId?: string,
    referrerStudentId?: string,
  ) {
    await wait();
    mockStudentState.profile.referrerStaffId =
      referrerStaffId || mockStudentState.profile.referrerStaffId;
    mockStudentState.profile.referrerStudentId =
      referrerStudentId || mockStudentState.profile.referrerStudentId;
    return {
      token: `mock-student-token-${authCode}`,
      student: clone(mockStudentState.profile),
      isNew: !mockStudentState.profile.realnameVerified,
    };
  },

  async verifyRealname(data: { name: string; idNo: string; phone: string }) {
    await wait();
    const age = getAgeFromIdNo(data.idNo);
    if (age < 18) {
      throw new Error("未满 18 周岁，暂不可报名分期课程");
    }

    mockStudentState.profile = {
      ...mockStudentState.profile,
      realname: data.name,
      phone: data.phone,
      realnameVerified: true,
      ageVerifiedAdult: true,
    };

    return clone(mockStudentState.profile);
  },

  async bindPhone(phone: string, _smsCode: string) {
    await wait();
    mockStudentState.profile.phone = phone;
    return { phone };
  },

  async getProfile() {
    await wait();
    return clone(mockStudentState.profile);
  },

  async getCourses(keyword?: string, page = 1) {
    await wait();
    const normalized = (keyword || "").trim().toLowerCase();
    const items = mockStudentState.courses.filter(
      (course) =>
        !normalized ||
        course.title.toLowerCase().includes(normalized) ||
        course.org.name.toLowerCase().includes(normalized),
    );

    return {
      items: clone(items),
      total: items.length,
      page,
    };
  },

  async getCourseDetail(id: string) {
    await wait();
    const course = mockStudentState.courses.find((item) => item.id === id);
    if (!course) {
      throw new Error("课程不存在");
    }
    return clone(course);
  },

  async createOrder(courseId: string) {
    await wait();
    const course = mockStudentState.courses.find(
      (item) => item.id === courseId,
    );
    if (!course) {
      throw new Error("课程不存在");
    }

    const orderId = `stu-order-created-${Date.now()}`;
    const order: StudentOrder = {
      id: orderId,
      status: "CREATED",
      totalAmount: course.price,
      periodCount: course.periodCount,
      periodAmount: Math.round(course.price / course.periodCount),
      createdAt: now(),
      coolingOffDeadline: addDays(7),
      course: { id: course.id, title: course.title },
      sellerOrg: clone(course.org),
      installmentItems: buildInstallments(
        orderId,
        course.price,
        course.periodCount,
      ),
    };

    mockStudentState.orders.unshift(order);
    return { id: order.id, status: order.status };
  },

  async signOrder(orderId: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }

    order.status = "COOLING_OFF";
    order.coolingOffDeadline = addDays(7);
    return {
      success: true,
      signUrl: `https://mock-esign.wangke.com/order/${orderId}`,
    };
  },

  async refundOrder(orderId: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }

    order.status = "REFUNDED";
    return { success: true, status: order.status };
  },

  async getOrders() {
    await wait();
    return clone(mockStudentState.orders);
  },

  async getOrderDetail(id: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === id);
    if (!order) {
      throw new Error("订单不存在");
    }
    return clone(order);
  },

  async getInstallments(orderId: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    return clone(order.installmentItems);
  },

  async creditAuthorize(orderId: string) {
    await wait();
    return {
      orderId,
      eligible: true,
      riskTier: "A",
      suggestedLimit: 198000,
      provider: "builtin",
    };
  },

  async signCreditAgreement(orderId: string) {
    await wait();
    return {
      orderId,
      agreementNo: `AGREEMENT-${orderId}`,
      status: "SIGNED",
    };
  },

  async getLearningProgress(orderId: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    return {
      installments: clone(order.installmentItems),
      checkins: clone(mockStudentState.checkins[orderId] || []),
      incentives: clone(mockStudentState.incentives[orderId] || []),
    };
  },

  async checkin(orderId: string, coursePeriod: number, faceToken: string) {
    await wait();
    const matched = !faceToken.includes("fail");
    const record = {
      id: `checkin-${Date.now()}`,
      matched,
      coursePeriod,
      createdAt: now(),
    };
    mockStudentState.checkins[orderId] = [
      ...(mockStudentState.checkins[orderId] || []),
      record,
    ];

    if (matched) {
      mockStudentState.incentives[orderId] = [
        ...(mockStudentState.incentives[orderId] || []),
        { id: `incentive-${Date.now()}`, amount: 500, createdAt: now() },
      ];
    }

    return {
      matched,
      incentiveAmount: matched ? 500 : 0,
    };
  },

  async generateInviteLink() {
    await wait();
    return {
      link: `https://mp.wangke.com/register?inv=${mockStudentState.profile.id}`,
    };
  },

  async getReferralRewards() {
    await wait();
    return clone(mockStudentState.referralRewards);
  },

  // 手机号体系（mock 不校验验证码和密码，任意值均成功）
  async sendSmsCode(_phone: string, _type: "register" | "reset") {
    await wait();
    return { success: true };
  },

  async registerByPhone(phone: string, _code: string, _password: string, _orgCode: string) {
    await wait();
    mockStudentState.profile.phone = phone;
    return {
      token: `mock-student-token-register-${phone}`,
      student: clone(mockStudentState.profile),
      isNew: true,
    };
  },

  async loginByPhone(phone: string, _password: string) {
    await wait();
    if (phone) {
      mockStudentState.profile.phone = phone;
    }
    return {
      token: `mock-student-token-phone-${phone}`,
      student: clone(mockStudentState.profile),
      isNew: !mockStudentState.profile.realnameVerified,
    };
  },

  async resetPassword(_phone: string, _code: string, _newPassword: string) {
    await wait();
    return { success: true };
  },

  // 视频
  async getCourseVideos(courseId: string) {
    await wait();
    return [
      { id: `${courseId}-v1`, title: "第一节：课程介绍", duration: "12:30" },
      { id: `${courseId}-v2`, title: "第二节：基础入门", duration: "28:45" },
      { id: `${courseId}-v3`, title: "第三节：核心技能", duration: "35:20" },
      { id: `${courseId}-v4`, title: "第四节：实战演练", duration: "42:10" },
    ];
  },

  async getVideoUrl(videoId: string) {
    await wait();
    // 返回一个示例视频地址（实际接入时替换为真实防盗链 URL）
    return `https://vod.example.com/mock/${videoId}.mp4`;
  },

  // 教师
  async getTeacherInfo(courseId: string) {
    await wait();
    const teacherMap: Record<string, any> = {
      "course-ui-001": {
        name: "韩松",
        title: "资深 UI 设计师",
        bio: "11 年 B 端与电商设计经验，服务过多家上市公司，带过 300+ 学员项目落地。",
        phone: "13800138001",
        qrCode: "",
      },
      "course-video-001": {
        name: "陈洛",
        title: "短视频运营专家",
        bio: "操盘过多条百万播放账号，擅长账号定位与内容爆款方法论。",
        phone: "13800138002",
        qrCode: "",
      },
      "course-ai-001": {
        name: "顾言",
        title: "企业数字化顾问",
        bio: "深耕 AI 办公效率领域，为多家企业提供数字化转型方案。",
        phone: "13800138003",
        qrCode: "",
      },
    };
    return teacherMap[courseId] || { name: "授课老师", title: "讲师", bio: "", phone: "" };
  },

  // 签约（mock 直接成功）
  async signWithFadadada(orderId: string) {
    await wait(400);
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (order) {
      order.status = "ACTIVE";
    }
    return { success: true, signUrl: `https://mock-fadadada.com/sign/${orderId}` };
  },

  async signWithEqianbao(orderId: string) {
    await wait(400);
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    if (order) {
      order.status = "ACTIVE";
    }
    return { success: true, signUrl: `https://mock-eqianbao.com/sign/${orderId}` };
  },

  async checkSignStatus(orderId: string) {
    await wait();
    const order = mockStudentState.orders.find((item) => item.id === orderId);
    return { signed: order?.status === "ACTIVE" };
  },
};
