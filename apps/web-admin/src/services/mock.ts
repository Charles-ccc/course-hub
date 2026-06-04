type AdminOrgRecord = {
  id: string;
  name: string;
  unifiedCreditCode: string;
  settlementFeeRate: number;
  depositBalance: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";
  gmv: number;
  platformServiceFee: number;
};

type AdminConfigRecord = {
  priceCap: number;
  zhimaEnabled: boolean;
};

type AdminStaffRecord = {
  id: string;
  name: string;
  phone: string;
  contractType: "EMPLOYEE" | "AGENT";
  status: "ACTIVE" | "DISABLED";
  studentCount: number;
  commissionTotal: number;
};

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const mockAdminState: {
  orgs: AdminOrgRecord[];
  config: AdminConfigRecord;
  staff: AdminStaffRecord[];
} = {
  orgs: [
    {
      id: "org-pending-001",
      name: "星火职训中心",
      unifiedCreditCode: "91330100MOCKPENDING1",
      settlementFeeRate: 0.035,
      depositBalance: 300000,
      status: "PENDING",
      gmv: 0,
      platformServiceFee: 0,
    },
    {
      id: "org-active-001",
      name: "青禾设计学院",
      unifiedCreditCode: "91330100MOCKACTIVE01",
      settlementFeeRate: 0.03,
      depositBalance: 800000,
      status: "ACTIVE",
      gmv: 3280000,
      platformServiceFee: 98400,
    },
    {
      id: "org-active-002",
      name: "知行电商学堂",
      unifiedCreditCode: "91330100MOCKACTIVE02",
      settlementFeeRate: 0.028,
      depositBalance: 600000,
      status: "ACTIVE",
      gmv: 2150000,
      platformServiceFee: 60200,
    },
    {
      id: "org-suspended-001",
      name: "远航短视频训练营",
      unifiedCreditCode: "91330100MOCKSUSPEND1",
      settlementFeeRate: 0.032,
      depositBalance: 180000,
      status: "SUSPENDED",
      gmv: 960000,
      platformServiceFee: 30720,
    },
    {
      id: "org-exited-001",
      name: "旧梦考证课堂",
      unifiedCreditCode: "91330100MOCKEXITED01",
      settlementFeeRate: 0.03,
      depositBalance: 0,
      status: "EXITED",
      gmv: 460000,
      platformServiceFee: 13800,
    },
  ],
  config: {
    priceCap: 1000000,
    zhimaEnabled: false,
  },
  staff: [
    {
      id: "staff-demo-001",
      name: "张卓",
      phone: "138****0001",
      contractType: "AGENT",
      status: "ACTIVE",
      studentCount: 12,
      commissionTotal: 18000,
    },
    {
      id: "staff-emp-002",
      name: "李敏",
      phone: "139****0002",
      contractType: "EMPLOYEE",
      status: "ACTIVE",
      studentCount: 7,
      commissionTotal: 8600,
    },
    {
      id: "staff-agent-003",
      name: "周衡",
      phone: "137****0003",
      contractType: "AGENT",
      status: "DISABLED",
      studentCount: 3,
      commissionTotal: 4200,
    },
  ],
};

const getHealthStatus = (
  repaymentRate: number,
  overdueRate: number,
  refundRate: number,
) => ({
  repaymentRate: repaymentRate >= 92 ? "healthy" : "warning",
  overdueRate: overdueRate <= 9 ? "healthy" : "warning",
  refundRate: refundRate <= 5 ? "healthy" : "warning",
});

const buildHealthMetrics = () => {
  const activeOrgs = mockAdminState.orgs.filter(
    (org) => org.status === "ACTIVE",
  );
  const totalGmv = activeOrgs.reduce((sum, org) => sum + org.gmv, 0);
  const repaymentRate = 93.6;
  const overdueRate = 8.4;
  const refundRate = 3.1;

  return {
    totalGmv,
    activeOrderCount: 186,
    repaymentRate,
    overdueRate,
    refundRate,
    healthStatus: getHealthStatus(repaymentRate, overdueRate, refundRate),
  };
};

export const mockAdminApi = {
  async login(username: string, _password: string) {
    await wait();
    return {
      token: `mock-admin-token-${username}`,
      role: "PLATFORM_ADMIN",
      username,
    };
  },

  async getOrgs() {
    await wait();
    return {
      items: clone(mockAdminState.orgs),
      total: mockAdminState.orgs.length,
    };
  },

  async getStaffList() {
    await wait();
    return {
      items: clone(mockAdminState.staff),
      total: mockAdminState.staff.length,
    };
  },

  async approveOrg(id: string, feeRate: number) {
    await wait();
    const target = mockAdminState.orgs.find((org) => org.id === id);
    if (!target) {
      throw new Error("机构不存在");
    }

    target.status = "ACTIVE";
    target.settlementFeeRate = feeRate;
    target.depositBalance = target.depositBalance || 500000;

    return clone(target);
  },

  async suspendOrg(id: string, reason: string) {
    await wait();
    const target = mockAdminState.orgs.find((org) => org.id === id);
    if (!target) {
      throw new Error("机构不存在");
    }

    target.status = "SUSPENDED";
    return {
      ...clone(target),
      suspendReason: reason,
    };
  },

  async disableStaff(id: string) {
    await wait();
    const target = mockAdminState.staff.find((staff) => staff.id === id);
    if (!target) {
      throw new Error("业务员不存在");
    }

    target.status = "DISABLED";
    return clone(target);
  },

  async getHealthMetrics() {
    await wait();
    return buildHealthMetrics();
  },

  async getGmv(period: string) {
    await wait();
    const activeOrgs = mockAdminState.orgs.filter(
      (org) => org.status === "ACTIVE",
    );
    const monthFactor = Number(period.split("-")[1] || "1") / 12;
    const orgs = activeOrgs.map((org) => ({
      id: org.id,
      orgName: org.name,
      gmv: Math.round(org.gmv * (0.85 + monthFactor * 0.2)),
      platformServiceFee: Math.round(
        org.platformServiceFee * (0.85 + monthFactor * 0.2),
      ),
      status: org.status === "ACTIVE" ? "稳定经营" : org.status,
    }));

    return {
      period,
      totalGmv: orgs.reduce((sum, org) => sum + org.gmv, 0),
      totalFee: orgs.reduce((sum, org) => sum + org.platformServiceFee, 0),
      orgs,
    };
  },

  async setPriceCap(cap: number) {
    await wait();
    mockAdminState.config.priceCap = cap;
    return clone(mockAdminState.config);
  },

  async setCreditConfig(config: { zhimaEnabled: boolean }) {
    await wait();
    mockAdminState.config = {
      ...mockAdminState.config,
      ...config,
    };
    return clone(mockAdminState.config);
  },

  async getSettlement(_page = 1) {
    await wait();
    const items = mockAdminState.orgs
      .filter((o) => o.status === "ACTIVE" || o.status === "SUSPENDED")
      .map((o, i) => ({
        id: `settlement-${o.id}-2026-05`,
        orgId: o.id,
        org: { name: o.name },
        period: "2026-05",
        gmv: o.gmv,
        platformServiceFee: o.platformServiceFee,
        status: i === 0 ? "PENDING" : "SETTLED",
      }));
    return { items, total: items.length };
  },

  async doSettle(id: string) {
    await wait();
    return { id, status: "SETTLED" };
  },

  async getOverdueRate() {
    await wait();
    return { overdueRate: "8.4%", overdueCount: 12, totalCount: 143 };
  },
};
