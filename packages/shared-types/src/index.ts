// ==================== 枚举 ====================

export enum OrgStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXITED = 'exited',
}

export enum OrderStatus {
  CREATED = 'created',
  COOLING_OFF = 'cooling_off',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  TERMINATED = 'terminated',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

export enum DeductionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum CommissionStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
  HELD = 'held',
  CLAWED_BACK = 'clawed_back',
}

export enum CommissionType {
  CLOSING = 'closing',
  PERFORMANCE = 'performance',
}

export enum ReferralStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export enum CreditProvider {
  BUILTIN = 'builtin',
  ZHIMA = 'zhima',
  WECHAT = 'wechat',
}

export enum ScenarioCode {
  INSTALLMENT_COURSE = 'INSTALLMENT_COURSE',
  DEPOSIT_FREE_RENT = 'DEPOSIT_FREE_RENT',
}

export enum StaffContractType {
  EMPLOYEE = 'employee',
  AGENT = 'agent',
}

export enum StaffStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum CourseStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum PaymentChannel {
  WECHAT_SCORE = 'wechat_score',
  ZHIMA = 'zhima',
  BANKCARD = 'bankcard',
}

export enum SettlementStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
}

export enum DepositLedgerType {
  DEPOSIT_IN = 'deposit_in',
  RISK_DEDUCTION = 'risk_deduction',
  REFUND = 'refund',
}

export enum ServiceRecordType {
  QA = 'qa',
  TEACHER_OUTREACH = 'teacher_outreach',
  CONTENT_UNLOCK = 'content_unlock',
  CHECKIN = 'checkin',
}

// ==================== 通用响应 ====================

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  size?: number;
}

// ==================== 用户/学员 ====================

export interface StudentProfile {
  id: string;
  phone: string;
  realname: string;
  realnameVerified: boolean;
  ageVerifiedAdult: boolean;
  referrerStaffId?: string;
  referrerStudentId?: string;
  createdAt: string;
}

export interface StudentMasked {
  id: string;
  phone: string;
  maskedName: string;
  orderCount: number;
  activeOrderCount: number;
}

// ==================== 机构 ====================

export interface OrgProfile {
  id: string;
  name: string;
  unifiedCreditCode: string;
  businessLicenseUrl: string;
  eduQualificationUrl: string;
  settlementFeeRate: number;
  depositBalance: number;
  exitNoticeDays: number;
  status: OrgStatus;
  createdAt: string;
}

// ==================== 课程 ====================

export interface CourseInfo {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  outline: string;
  teacherInfo: string;
  price: number;
  periodCount: number;
  periodAmount: number;
  reviewPeriodDays: number;
  status: CourseStatus;
  createdAt: string;
}

// ==================== 订单 ====================

export interface OrderInfo {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  sellerOrgId: string;
  sellerOrgName: string;
  totalAmount: number;
  periodCount: number;
  periodAmount: number;
  status: OrderStatus;
  contractId?: string;
  coolingOffDeadline?: string;
  createdAt: string;
}

export interface InstallmentItemInfo {
  id: string;
  orderId: string;
  periodNo: number;
  dueDate: string;
  planAmount: number;
  actualAmount: number;
  deductedAmount: number;
  status: InstallmentStatus;
  contentDeliveredAt?: string;
}

// ==================== 提成 ====================

export interface CommissionInfo {
  id: string;
  staffId: string;
  orderId: string;
  type: CommissionType;
  periodNo?: number;
  amount: number;
  status: CommissionStatus;
  createdAt: string;
}

// ==================== 信用决策 ====================

export interface CreditDecisionInfo {
  eligible: boolean;
  riskTier?: 'A' | 'B' | 'C';
  suggestedLimit?: number;
  provider: CreditProvider;
  providerRef: string;
}

// ==================== 错误码 ====================

export const ErrorCodes = {
  UNDERAGE_USER: 40001,
  PRICE_LIMIT_EXCEEDED: 40002,
  DUPLICATE_REQUEST: 40901,
  CONTENT_NOT_DELIVERED: 42201,
  CREDIT_PROVIDER_NOT_ENABLED: 42202,
  INVALID_MERCHANT_SUBJECT: 42203,
} as const;
