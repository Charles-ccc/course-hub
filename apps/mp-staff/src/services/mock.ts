const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const mockStaffState = {
  profile: {
    id: "staff-demo-001",
    name: "张卓",
    phone: "138****0001",
    contractType: "AGENT",
    status: "ACTIVE",
    groupName: "华东增长组",
    commissionRate: 0.12,
  },
  dashboard: {
    settled: 56800,
    pending: 82400,
    held: 23600,
  },
  records: [
    {
      id: "commission-001",
      type: "CLOSING",
      amount: 12000,
      status: "SETTLED",
      createdAt: "2026-05-10T10:00:00.000Z",
      studentName: "林*",
      courseTitle: "UI 设计商业实战营",
    },
    {
      id: "commission-002",
      type: "PERFORMANCE",
      periodNo: 2,
      amount: 3200,
      status: "PENDING",
      createdAt: "2026-05-29T10:00:00.000Z",
      studentName: "周*",
      courseTitle: "短视频剪辑增长课",
    },
    {
      id: "commission-003",
      type: "PERFORMANCE",
      periodNo: 3,
      amount: 2800,
      status: "HELD",
      createdAt: "2026-06-01T10:00:00.000Z",
      studentName: "何*",
      courseTitle: "AI 办公效率班",
    },
    {
      id: "commission-004",
      type: "CLOSING",
      amount: 5000,
      status: "CLAWED_BACK",
      createdAt: "2026-05-05T10:00:00.000Z",
      studentName: "高*",
      courseTitle: "短视频剪辑增长课",
    },
  ],
  students: [
    {
      id: "stu-001",
      realname: "林*",
      phone: "138****1234",
      orders: [{ id: "order-001", status: "ACTIVE" }],
    },
    {
      id: "stu-002",
      realname: "周*",
      phone: "139****4567",
      orders: [{ id: "order-002", status: "COOLING_OFF" }],
    },
    {
      id: "stu-003",
      realname: "高*",
      phone: "137****7890",
      orders: [{ id: "order-003", status: "COMPLETED" }],
    },
    {
      id: "stu-004",
      realname: "何*",
      phone: "136****1122",
      orders: [{ id: "order-004", status: "OVERDUE" }],
    },
  ],
};

export const mockStaffApi = {
  async loginWithWechat(code: string) {
    await wait();
    return {
      token: `mock-staff-token-${code}`,
      staff: clone(mockStaffState.profile),
      isNew: false,
    };
  },

  async loginWithAlipay(authCode: string) {
    return this.loginWithWechat(authCode);
  },

  async getCommissionDashboard() {
    await wait();
    return {
      ...clone(mockStaffState.dashboard),
      records: clone(mockStaffState.records),
    };
  },

  async getStudents(page = 1) {
    await wait();
    return {
      items: clone(mockStaffState.students),
      total: mockStaffState.students.length,
      page,
    };
  },

  async getProfile() {
    await wait();
    return clone(mockStaffState.profile);
  },
};
