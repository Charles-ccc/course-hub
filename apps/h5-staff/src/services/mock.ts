const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const now = new Date();
const daysFromNow = (d: number) => {
  const t = new Date(now);
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

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
      orders: [
        {
          id: "order-001",
          status: "ACTIVE",
          periodCount: 12,
          completedPeriods: 4,
          nextDueDate: daysFromNow(3),
          courseTitle: "UI 设计商业实战营",
        },
      ],
    },
    {
      id: "stu-002",
      realname: "周*",
      phone: "139****4567",
      orders: [
        {
          id: "order-002",
          status: "ACTIVE",
          periodCount: 6,
          completedPeriods: 6,
          nextDueDate: daysFromNow(0),
          courseTitle: "短视频剪辑增长课",
        },
      ],
    },
    {
      id: "stu-003",
      realname: "高*",
      phone: "137****7890",
      orders: [
        {
          id: "order-003",
          status: "COMPLETED",
          periodCount: 6,
          completedPeriods: 6,
          nextDueDate: null,
          courseTitle: "短视频剪辑增长课",
        },
      ],
    },
    {
      id: "stu-004",
      realname: "何*",
      phone: "136****1122",
      orders: [
        {
          id: "order-004",
          status: "OVERDUE",
          periodCount: 9,
          completedPeriods: 2,
          nextDueDate: daysFromNow(-10),
          courseTitle: "AI 办公效率班",
        },
      ],
    },
    {
      id: "stu-005",
      realname: "赵*",
      phone: "135****3344",
      orders: [
        {
          id: "order-005",
          status: "ACTIVE",
          periodCount: 12,
          completedPeriods: 8,
          nextDueDate: daysFromNow(6),
          courseTitle: "Python 数据分析特训",
        },
      ],
    },
    {
      id: "stu-006",
      realname: "王*",
      phone: "134****5566",
      orders: [
        {
          id: "order-006",
          status: "OVERDUE",
          periodCount: 6,
          completedPeriods: 1,
          nextDueDate: daysFromNow(-3),
          courseTitle: "新媒体运营实战",
        },
      ],
    },
  ],
};

function filterStudents(students: any[], tab: string) {
  if (tab === "all") return students;

  const nowTs = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return students.filter((s) => {
    const order = (s.orders || [])[0];
    if (!order) return false;

    if (tab === "overdue") {
      return order.status === "OVERDUE";
    }
    if (tab === "due7") {
      if (!order.nextDueDate) return false;
      const diff = new Date(order.nextDueDate).getTime() - nowTs;
      return diff >= 0 && diff <= sevenDays;
    }
    if (tab === "due") {
      if (!order.nextDueDate) return false;
      const diff = new Date(order.nextDueDate).getTime() - nowTs;
      return diff >= -24 * 60 * 60 * 1000 && diff <= 24 * 60 * 60 * 1000;
    }
    return true;
  });
}

export const mockStaffApi = {
  async loginByPhone(phone: string, _password: string) {
    await wait();
    return {
      token: `mock-staff-token-${phone}`,
      staff: {
        ...clone(mockStaffState.profile),
        phone,
      },
      isNew: false,
    };
  },

  async getCommissionDashboard() {
    await wait();
    return {
      ...clone(mockStaffState.dashboard),
      records: clone(mockStaffState.records),
    };
  },

  async getStudents(page = 1, tab = "all") {
    await wait();
    const filtered = filterStudents(clone(mockStaffState.students), tab);
    return {
      items: filtered,
      total: filtered.length,
      page,
    };
  },

  async getProfile() {
    await wait();
    return clone(mockStaffState.profile);
  },
};
