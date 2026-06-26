# mp-student · 学员小程序前后端技术方案

> **版本：v1.0** | 创建日期：2026-06-16  
> 本文档对应 PRD v2.0，按三个迭代阶段描述前端、后端的实现边界、接口定义与数据库变更。

---

# 1. 技术选型与约束

| 层            | 技术栈                                  | 说明                                                                   |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| 小程序前端    | 支付宝原生小程序（AXML + ACSS + JS/TS） | 仅支持支付宝端，按原生工程组织页面与组件                               |
| 状态管理      | 原生全局状态（App() + 页面 data）       | 轻量会话状态放 `globalData`，持久状态放 `my.setStorageSync`            |
| 请求层        | 原生 `my.request` + 统一 request 封装   | 统一处理 baseURL、Authorization、错误码映射、401 刷新重试              |
| 后端          | NestJS + TypeScript                     | 已有项目 apps/api，继续在此项目开发                                    |
| ORM           | Prisma + MySQL                          | 现有数据库，Schema 已有基础模型                                        |
| 认证          | JWT（access + refresh token）           | 与其他端复用同一 RefreshToken 表                                       |
| 支付宝身份    | 支付宝开放平台 SDK（alipay-sdk-nodejs） | authCode 换 openId、手机号解密、人脸核身初始化与查询                   |
| 缓存/限流     | Redis（ioredis via `redis`）            | 限流计数；RateLimitStoreService 已集成（不再存储短信验证码）           |
| 小程序 UI     | 支付宝原生组件 + 业务自定义组件         | 重点使用基础组件（view/text/input/button/video），不依赖跨端 UI 组件库 |
| 文件/视频存储 | 腾讯云 COS / VOD（Iter 2）              | Iter 1 暂不上传视频，接口路径预留                                      |

---

# 2. 后端架构

## 2.1 模块划分

在现有 `apps/api/src/modules/` 下新增/补充以下模块：

```
src/modules/
├── auth/               ← 已有，保持不变（机构/业务员登录）
├── student-auth/       ← 新增，学员专用认证（注册、登录、支付宝、实名等）
│   ├── student-auth.module.ts
│   ├── student-auth.controller.ts    # @Controller('auth') 前缀，学员专用路由
│   └── student-auth.service.ts
├── student/
│   ├── student.module.ts   ← 补充注册，已有骨架
│   ├── course/             ← 补充课程列表/详情接口
│   ├── order/              ← 补充下单、订单列表接口
│   └── learning/           ← 补充章节列表接口（Iter1）、打卡（Iter3）
└── user/               ← 新增实名认证接口
```

> **学员端认证策略：** 学员登录完全依赖支付宝 authCode，无密码体系。`StudentAuthController` 为新增，与现有 `AuthController` 共享 `@Controller('auth')` 前缀，路由路径不冲突。核心端点：`POST /auth/alipay/login`、`POST /auth/alipay/register`、`POST /auth/refresh`。

## 2.2 Guard 与权限设计

| Guard                   | 适用范围       | 说明                                             |
| ----------------------- | -------------- | ------------------------------------------------ |
| StudentJwtGuard         | 所有学员端接口 | 解析 JWT，注入 req.student                       |
| OptionalStudentJwtGuard | 课程列表、详情 | 未登录可访问，登录后带用户上下文                 |
| RealnameGuard           | 下单接口       | `realnameStatus !== VERIFIED` 时拒绝，返回 40301 |

---

# 3. 数据库变更（Prisma Schema）

## 3.1 Iter 1 新增字段与表

### 3.1.1 Student 表补充字段

```prisma
model Student {
  // 已有字段...
  alipayOpenId    String?   @unique    // 支付宝 openId（唯一，用于登录查找）
  // passwordHash 已移除：无密码体系，登录完全依赖支付宝 authCode
  realnameRecord  RealnameRecord?      // 实名认证记录（1:1）
}
```

### 3.1.2 RefreshToken 表扩展（扩展现有表，不另建）

现有 `RefreshToken` 表已通过可选 FK 列（`adminUserId?` / `insitutionUserId?` / `salesmanId?`）实现多角色 Token 管理，学员 Token 沿用同一模式。

新增字段：

```prisma
model RefreshToken {
  // 已有字段...
  studentId   String?
  student     Student?  @relation(fields: [studentId], references: [id])
}
```

同步修改 `common/auth/auth.types.ts`：

```typescript
export type AppRole =
  | "PLATFORM_ADMIN"
  | "INSITUTION_ADMIN"
  | "STAFF"
  | "STUDENT";
```

同步修改 `common/auth/token.service.ts` 中 `refreshAccessToken` 的 owner 映射：

```typescript
const refreshOwner =
  role === "PLATFORM_ADMIN"
    ? { adminUserId: payload.sub }
    : role === "INSITUTION_ADMIN"
      ? { insitutionUserId: payload.sub }
      : role === "STUDENT"
        ? { studentId: payload.sub }
        : { salesmanId: payload.sub };
```

同步修改 `modules/auth/dto/phone-login.dto.ts` 中 `LoginRespDto`，增加 STUDENT 角色和 profile 字段：

```typescript
export interface LoginRespDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: "INSITUTION_ADMIN" | "STAFF" | "STUDENT";
  userId: string;
  displayName: string;
  // ...existing optional fields...
  isNew?: boolean; // STUDENT_MP 首次登录标识
  studentProfile?: StudentProfile;
}
```

### 3.1.3 CourseVideo 表（新增，Iter 1 骨架，Iter 2 填充实际 URL）

```prisma
model CourseVideo {
  id          String   @id
  courseId    String
  title       String
  durationSec Int      @default(0)     // 时长（秒），Iter 1 可为 0
  sortOrder   Int
  storageKey  String?                  // COS/VOD 存储 key，Iter 2 填充
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  course      Course   @relation(fields: [courseId], references: [id])

  @@index([courseId, sortOrder])
}
```

### 3.1.4 Course 表补充字段

```prisma
model Course {
  // 已有字段...
  outline         String?   @db.Text   // 课程大纲
  teacherContact  String?              // 联系老师信息（JSON: {wechat, phone}）
  videos          CourseVideo[]
}
```

### 3.1.5 OrgCode 表（新增）

机构码管理，目前代码中通过业务员关联机构，需要显式的邀请码模型。

```prisma
enum OrgCodeStatus {
  ACTIVE
  DISABLED
  EXPIRED
}

model OrgCode {
  id           String        @id
  code         String        @unique   // 6-8 位大写字母数字
  insitutionId String
  salesmanId   String?                 // 关联业务员（可选）
  status       OrgCodeStatus @default(ACTIVE)
  expireAt     DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  insitution   Insitution    @relation(fields: [insitutionId], references: [id])
  salesman     Salesman?     @relation(fields: [salesmanId], references: [id])
}
```

### 3.1.6 RealnameRecord 表（新增）

身份证号不明文存储，仅存 SHA-256 hash 用于唯一性校验。实名记录独立成表，支持审计与将来的多次核验。

```prisma
model RealnameRecord {
  id            String    @id
  studentId     String    @unique      // 1:1，每个学员最多一条
  certifyId     String                 // 支付宝核身流水号（唯一，用于查询结果）
  nameDesensit  String?               // 脱敏姓名（如：张*）
  idNoSuffix    String?               // 身份证后 4 位（仅用于展示）
  verifiedAt    DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  student       Student   @relation(fields: [studentId], references: [id])
}
```

> 实名信息由支付宝核验，后端不接收也不存储原始身份证号；仅存储核身流水号（certifyId）用于结果查询，以及脱敏展示字段。

### 3.1.7 Order 表补充字段

```prisma
model Order {
  // 已有字段...
  payType     String  @default("DEFERRED")   // IMMEDIATE | DEFERRED（先学后付）
  orgCodeId   String?                         // 下单时使用的机构码
}
```

## 3.2 Iter 2 新增

### 3.2.1 Order 表新增字段

```prisma
model Order {
  // 已有字段...
  creditBizOrderId  String?   // 芝麻先享信用订单号（仅 DEFERRED 订单，creditbizorder.create 返回）
  signRecordId      String?   // 电子签约流水号（法大大/e签宝，所有订单）
}
```

### 3.2.2 SignRecord 表（电子签约留痕，供第三方服务商对接）

```prisma
enum SignStatus {
  PENDING
  SIGNED
  FAILED
}

model SignRecord {
  id          String     @id
  orderId     String     @unique
  provider    String                // "fadada" | "esign"（第三方服务商标识）
  flowId      String                // 第三方签约流程号
  status      SignStatus @default(PENDING)
  signedAt    DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  order       Order      @relation(fields: [orderId], references: [id])
}
```

> 电子签约（法大大/e签宝）与芝麻先享授权是两个独立步骤，互不替代：
> - `SignRecord`：所有订单（IMMEDIATE + DEFERRED）均需完成，用于留存本人签约证据
> - `creditBizOrderId`：仅 DEFERRED 订单额外需要，用于芝麻先享周期扣款授权

## 3.3 Iter 3 新增

### 3.3.1 CheckinRecord 表（人脸打卡记录）

```prisma
model CheckinRecord {
  id            String   @id
  orderId       String
  studentId     String
  coursePeriod  Int
  certifyId     String               // 支付宝人脸核身流水号
  verifyResult  String               // PASS | FAIL
  rewardCents   Int      @default(0) // 本次激励金额（分）
  createdAt     DateTime @default(now())
  order         Order    @relation(fields: [orderId], references: [id])

  @@index([orderId, coursePeriod])
}
```

## 3.4 注册流程：insitutionId 赋值链路

学员注册时提交 `orgCode`，后端通过以下步骤填充 `Student.insitutionId`：

1. 查找 `OrgCode`（校验 status = ACTIVE、expireAt > now）
2. 取 `OrgCode.insitutionId` → 赋值给新建 `Student.insitutionId`
3. 取 `OrgCode.salesmanId`（可为 null）→ 赋值给 `Student.boundSalesmanId`

**OrgCode.salesmanId 为 null 时的行为：**

- 机构码校验响应：`salesmanName: null`，前端展示「您将加入：XX 机构」，不展示业务员信息
- 注册后 `Student.boundSalesmanId = null`，PRD § 4.5.3「无来源」规则适用
- 业务规则：机构码必须关联机构（insitutionId 不可空），salesmanId 可空

## 3.5 IMMEDIATE 付款订单 Iter1 行为说明

| 迭代  | 行为                                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Iter1 | `POST /orders` 创建后 status = `CREATED`（无论 payType）。`IMMEDIATE` 订单**不创建 Installment 记录**，机构后台人工审核激活。       |
| Iter2 | 所有订单：电子签约（法大大/e签宝）完成后 SignRecord SIGNED。`DEFERRED` 订单额外完成芝麻先享授权后 status 更新为 `ACTIVE`，生成 Installment 记录。 |
| Iter3 | `IMMEDIATE` 订单：支付宝支付成功回调后，status 更新为 `ACTIVE`，生成单条 Installment（periodNo=1, dueDate=today, status=PENDING）。 |

> Iter1 学员端订单详情中 `CREATED` 状态下的签约按钮（占位）是目前唯一的操作入口，`installments` 数组在此状态下返回空数组。

---

# 4. API 接口定义

> 所有接口前缀：`/api/v1`  
> 认证方式：`Authorization: Bearer <accessToken>`  
> 金额单位：分（Integer），前端展示时除以 100 转元  
> 时间格式：ISO 8601 UTC 字符串

## 4.1 认证模块（后端：student-auth module）

### 4.1.1 机构码校验

```
POST /auth/org-code/validate
Auth: 必须登录（StudentJwtGuard）
Body: { orgCode: string }

Response 200:
{
  insitutionName: string,
  salesmanName: string | null,
  salesmanId: string | null
}

Error:
  40001 ORG_CODE_NOT_FOUND
  40002 ORG_CODE_EXPIRED
  40003 ORG_CODE_DISABLED
  40007 ORG_CODE_FROZEN  (同一 openId 24h 内失败 ≥5 次，冻结 30min)
```

> 前端展示：`salesmanName` 有值时展示「XX 机构（业务员：张三）」，null 时仅展示「XX 机构」。

### 4.1.2 支付宝 authCode 登录 / 注册入口

```
POST /auth/alipay/login
Body: { authCode: string }

Response 200（已注册）:
{
  accessToken: string,
  refreshToken: string,
  profile: StudentProfile
}

Response 200（未注册）:
{
  needRegister: true
}
```

> 后端逻辑：用 `authCode` 调用支付宝服务端接口换取 `openId`（`alipay.system.oauth.token`），查 Student 表：
> - 存在 → 签发 JWT，返回 profile
> - 不存在 → 返回 `needRegister: true`，前端跳注册引导页

### 4.1.3 支付宝手机号授权注册

```
POST /auth/alipay/register
Body: {
  authCode: string,
  encryptedData: string,    // 支付宝手机号授权加密数据
  iv: string,               // 解密向量
  orgCode: string,
  inviteSalesmanId?: string
}

Response 201:
{
  accessToken: string,
  refreshToken: string,
  profile: StudentProfile
}

Error:
  40004 PHONE_ALREADY_BOUND   (该手机号已绑定其他 openId)
  40007 ORG_CODE_FROZEN
  40008 PHONE_DECRYPT_FAILED  (支付宝加密数据解密失败)
```

> **手机号获取方式**：前端调用 `my.getPhoneNumber()`（JSAPI，直接 JS 调用，非按钮组件），
> 支付宝弹出授权确认后回调中拿到加密手机号数据（`response` 字段），传给后端解密。
>
> 后端逻辑：
> 1. `authCode` 换 `openId` + `sessionKey`（调用 `alipay.system.oauth.token`）
> 2. 用 `sessionKey` 解密 `response` 得到手机号（支付宝标准 AES 解密）
> 3. 通过 `orgCode` 查找 OrgCode，取 `insitutionId` 和 `salesmanId` 填充 Student
> 4. 创建 Student，写入 openId + phone + insitutionId + salesmanId
> 5. 签发 JWT 返回

### 4.1.4 刷新 Token

```
POST /auth/refresh
Body: { refreshToken: string }

Response 200: { accessToken: string, refreshToken: string }
```

**StudentProfile DTO（通用）**

```typescript
{
  id: string;
  phone: string;
  name: string | null;
  realnameVerified: boolean; // realnameStatus === VERIFIED
  insitutionId: string;
  boundSalesmanId: string | null;
}
```

---

## 4.2 用户模块（后端：user module，新增）

### 4.2.1 实名认证初始化（获取 certifyUrl）

```
POST /users/realname/initialize
Auth: 必须登录

Response 200: { certifyId: string, certifyUrl: string }

Error:
  40302 ALREADY_VERIFIED    (已完成实名，禁止重复提交)
  50000 ALIPAY_API_ERROR    (支付宝接口调用失败)
```

> 后端依次调用：
> 1. `alipay.user.certify.open.initialize` → 创建认证流程，获得 `certifyId`
> 2. `alipay.user.certify.open.certify` → 启动认证流程，获得 `certifyUrl`
>
> 前端拿到 `certifyUrl` 后，通过 `my.ap.navigateToAlipayPage` 或 WebView 跳转至支付宝认证页。
> `certifyId` 同时返回，用于后续结果查询。

### 4.2.2 实名认证结果确认

```
POST /users/realname/confirm
Auth: 必须登录
Body: { certifyId: string }

Response 200: { success: true, realnameVerified: true }

Error:
  40001 UNDERAGE_USER            (认证结果中年龄不满 18 周岁)
  40301 REALNAME_VERIFY_FAILED   (认证未通过)
  40302 ALREADY_VERIFIED         (已完成实名)
```

> 后端调用 `alipay.user.certify.open.query { certifyId }` 查询认证结果；
> 通过后写入 RealnameRecord（certifyId + 脱敏姓名 + 身份证后四位），更新 Student.realnameStatus = VERIFIED。
> 不存储原始姓名和完整身份证号。

---

## 4.3 课程模块（后端：student/course module）

### 4.3.1 课程列表

```
GET /courses?keyword=<string>&page=<int>&pageSize=<int>
Auth: 公开（无需登录可调用；前端实际限制必须登录）

Response 200:
{
  items: CourseItem[],
  total: number,
  page: number,
  pageSize: number,
  hasNext: boolean
}

CourseItem:
{
  id: string
  name: string
  insitutionName: string
  priceCents: number          // 总价（分）
  periodCount: number
  perPeriodCents: number      // 每期（分），= priceCents / periodCount
}
```

### 4.3.2 课程详情

```
GET /courses/:courseId
Auth: 可选

Response 200:
{
  id: string
  name: string
  insitutionName: string
  priceCents: number
  periodCount: number
  perPeriodCents: number
  outline: string | null
  teacherContact: { wechat?: string, phone?: string } | null
  complianceNote: string     // 固定文案：平台为居间方，机构为合同甲方
}
```

### 4.3.3 课程视频章节列表

```
GET /courses/:courseId/videos
Auth: 必须登录（试学时也需登录，通过 trial 参数控制响应）

Query: trial?: "1"

Response 200:
{
  items: VideoItem[]
}

VideoItem:
{
  id: string
  title: string
  durationSec: number
  sortOrder: number
  isTrial: boolean    // 是否为试学可见章节（第一节为 true）
}

说明：
  - trial=1 时响应仅返回第一节（isTrial=true 的章节）
  - 未购课学员（无对应 ACTIVE 订单）访问完整列表时，后端仍返回章节列表，
    但播放 URL 接口会鉴权拒绝
```

### 4.3.4 获取视频播放地址（Iter 2 实现，Iter 1 路径预留）

```
GET /courses/videos/:videoId/url
Auth: 必须登录，且有对应 ACTIVE 订单（或 trial 模式）

Response 200:
{
  playUrl: string,    // 带签名的点播 URL，有效期 1 小时
  expireAt: string
}

Error:
  40401 VIDEO_NOT_PURCHASED  (未购课，非试学模式)
  40402 VIDEO_NOT_FOUND

Iter 1：此接口不实现，返回 501 Not Implemented
Iter 2：对接腾讯云 VOD 或阿里云点播签名逻辑
```

---

## 4.4 订单模块（后端：student/order module）

### 4.4.1 创建订单

```
POST /orders
Auth: 必须登录，RealnameGuard
Body: { courseId: string, payType: "IMMEDIATE" | "DEFERRED" }

Response 201:
{
  orderId: string,
  status: "CREATED",
  totalAmountCents: number,
  periodCount: number
}

Error:
  40001 UNDERAGE_USER
  40002 PRICE_LIMIT_EXCEEDED
  40403 COURSE_NOT_FOUND
  40404 ALREADY_ENROLLED     (已有相同课程的 CREATED/ACTIVE 订单)
```

### 4.4.2 订单列表

```
GET /orders
Auth: 必须登录

Response 200:
{
  items: OrderItem[]
}

OrderItem:
{
  id: string
  courseId: string | null
  courseName: string
  insitutionName: string
  totalAmountCents: number
  periodCount: number
  payType: PayType
  status: OrderStatus
  createdAt: string
  overdueCount: number          // 逾期分期期数（0 表示无逾期）
  overdueAmountCents: number     // 逾期应还总额（分）
}
```

> `overdueCount` / `overdueAmountCents` 通过对 Installment 按 orderId 聚合 `status=OVERDUE` 得到（`groupBy` + `_count` + `_sum`）。
> 用途：守约链接落地到订单列表页后，逾期订单显示红色「N 期逾期待还 ¥X · 去还款」标识，引导用户点入详情页完成还款。

### 4.4.3 订单详情

```
GET /orders/:orderId
Auth: 必须登录，且为本人订单

Response 200:
{
  id: string
  courseName: string
  insitutionName: string
  totalAmountCents: number
  periodCount: number
  perPeriodCents: number
  status: OrderStatus
  payType: string
  createdAt: string
  installments: InstallmentItem[]   // ACTIVE/COMPLETED 时返回
}

InstallmentItem:
{
  periodNo: number
  dueDate: string
  plannedAmountCents: number
  paidAmountCents: number
  status: PeriodStatus
}
```

### 4.4.4 电子签约初始化（法大大/e签宝）

```
POST /orders/:orderId/sign/initialize
Auth: 必须登录，且为本人订单
适用：所有 payType（IMMEDIATE + DEFERRED）

模块 1-8 Response: 501 { message: "签约功能即将上线" }
模块 9 Response 200:
{
  signUrl: string    // 第三方签约页链接，前端 WebView 或跳转打开
}
```

> 后端调用法大大/e签宝 SDK 创建签约流程，返回签约链接。
> 创建 `SignRecord`（status=PENDING，flowId=第三方流程号），存入 `Order.signRecordId`。
>
> **注意：** 当前具体服务商（法大大 vs e签宝）待确认，接口路径和参数不变，
> 仅 provider 和 SDK 调用层需适配。计划使用第三方而非支付宝核身，
> 以保持平台无关性（兼容未来微信小程序/H5 迁移）。

### 4.4.5 电子签约确认（查询结果，所有订单通用）

```
POST /orders/:orderId/sign/confirm
Auth: 必须登录，且为本人订单
Body: {}

Response 200: { success: true, signStatus: "SIGNED" }

Error:
  40501 SIGN_NOT_COMPLETED   (用户尚未完成签约)
  40502 ORDER_NOT_FOUND
```

> 后端查询第三方签约状态；SIGNED → 更新 `SignRecord.status = SIGNED`，记录 `signedAt`。
> **此步骤仅完成签约留痕，不直接激活订单：**
> - `IMMEDIATE` 订单：签约后等待支付完成才激活（Iter3）
> - `DEFERRED` 订单：签约后还需完成芝麻先享授权才激活（见 4.4.6）

### 4.4.6 芝麻先享授权初始化（仅 DEFERRED 订单）

```
POST /orders/:orderId/zhima/initialize
Auth: 必须登录，且为本人订单，且 SignRecord.status = SIGNED

模块 1-9 Response: 501 { message: "授权功能即将上线" }
模块 10 Response 200:
{
  scheme: string    // 芝麻先享签约页 scheme URL，前端通过 my.ap.navigateToAlipayPage 跳转
}
```

> 前置条件：电子签约已完成（SignRecord.status = SIGNED）。
> 后端调用 `zhima.credit.payafteruse.creditbizorder.create`，参数：
> - `out_order_no` = `order.id.replace(/-/g, '_')`
> - `credit_amount` = 总价（分），`period_type` = `MONTH`，`period` = `course.periodCount`
> - `product_code` = `w1010100100000000001`
>
> 返回的 `credit_biz_order_id` 存入 `Order.creditBizOrderId`，`scheme` 直传前端。

### 4.4.7 芝麻先享授权确认（激活 DEFERRED 订单）

```
POST /orders/:orderId/zhima/confirm
Auth: 必须登录，且为本人订单
Body: {}

Response 200: { success: true, orderStatus: "ACTIVE" }

Error:
  40501 ZHIMA_NOT_COMPLETED   (用户尚未完成芝麻授权)
  40502 ORDER_NOT_FOUND
  40503 SIGN_REQUIRED         (电子签约未完成，不可授权)
```

> 后端调用 `zhima.credit.payafteruse.creditbizorder.query { out_order_no }`；
> SIGNED → `Order.status = ACTIVE`，按 `periodCount` 批量创建 Installment（status=PENDING）。

### 4.4.6 芝麻先享扣款回调（Notify）

```
POST /orders/zhima/notify
Auth: 无（IP 白名单 + 支付宝验签）

Body: 支付宝标准 notify 表单参数（application/x-www-form-urlencoded）

Response: "success"（纯文本，支付宝要求）
```

> 处理逻辑：
> 1. 验签（`alipayPublicKey`）
> 2. 根据 `out_order_no`（下划线形 UUID）还原 orderId
> 3. 根据 `period_no` 定位对应 `Installment`
> 4. 扣款成功（`notify_type = WITHHOLD_SUCCESS`）→ `Installment.status = PAID`
> 5. 扣款失败（`notify_type = WITHHOLD_FAILED`）→ `Installment.status = OVERDUE`
> 6. 若最后一期变为 PAID → `Order.status = COMPLETED`

---

## 4.5 学习模块（后端：student/learning module）

### 4.5.1 人脸打卡初始化（模块 11 实现）

```
POST /learning/checkin/initialize
Auth: 必须登录
Body: { orderId: string, coursePeriod: number }

模块 1-10 Response: 501 { message: "打卡功能即将上线" }
模块 11 Response 200:
{
  certifyId: string,
  certifyUrl: string    // 支付宝人脸核身页 URL
}
```

> 后端调用 `datadigital.fincloud.generalsaas.face.certify.initialize` 初始化打卡核身流程，再调用 `datadigital.fincloud.generalsaas.face.certify.verify` 启动认证，返回 `certifyUrl`（前端跳转）。

### 4.5.2 人脸打卡确认（模块 11 实现）

```
POST /learning/checkin/confirm
Auth: 必须登录
Body: { orderId: string, coursePeriod: number, certifyId: string }

模块 1-10 Response: 501 { message: "打卡功能即将上线" }
模块 11 Response 200:
{
  verifyResult: "PASS" | "FAIL",
  rewardCents: number
}

Error:
  42001 CHECKIN_LIMIT_EXCEEDED   (当期打卡次数已用完)
  42002 FACE_VERIFY_FAILED       (人脸比对不通过)
  42003 ORDER_NOT_ACTIVE         (订单非 ACTIVE 状态)
```

> 后端调用 `datadigital.fincloud.generalsaas.face.certify.query { certifyId }` 查询结果；
> 通过后写入 CheckinRecord，按配置发放学费抵扣激励。

---

# 5. 前端架构（apps/mp-student）

## 5.0 前端项目初始化规范

### 5.0.1 工程文件基线

`apps/mp-student` 目录采用支付宝原生小程序工程结构，核心文件如下：

```text
apps/mp-student/
├── app.js
├── app.json
├── app.acss
├── mini.project.json
├── sitemap.json
├── pages/
│   ├── guide/
│   │   ├── index.axml
│   │   ├── index.acss
│   │   ├── index.js
│   │   └── index.json
│   ├── auth/
│   ├── course/
│   ├── order/
│   ├── learning/
│   └── profile/
├── components/
├── services/
├── utils/
└── assets/
```

### 5.0.2 app.json 与 TabBar

路由由 `app.json` 维护，Tab 固定三项：课程、我的订单、我的。引导页不放在 Tab 中。

```json
{
  "pages": [
    "pages/guide/index",
    "pages/auth/register/index",
    "pages/auth/realname/index",
    "pages/index/index",
    "pages/course/detail/index",
    "pages/order/confirm/index",
    "pages/order/list/index",
    "pages/order/detail/index",
    "pages/learning/index/index",
    "pages/profile/index/index"
  ],
  "window": {
    "defaultTitle": "欢乐学",
    "titleBarColor": "#ffffff",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "textColor": "#999999",
    "selectedColor": "#FF6B00",
    "backgroundColor": "#FFFFFF",
    "items": [
      {
        "pagePath": "pages/index/index",
        "name": "课程",
        "icon": "assets/icons/tab-course.png",
        "activeIcon": "assets/icons/tab-course-active.png"
      },
      {
        "pagePath": "pages/order/list/index",
        "name": "我的订单",
        "icon": "assets/icons/tab-order.png",
        "activeIcon": "assets/icons/tab-order-active.png"
      },
      {
        "pagePath": "pages/profile/index/index",
        "name": "我的",
        "icon": "assets/icons/tab-profile.png",
        "activeIcon": "assets/icons/tab-profile-active.png"
      }
    ]
  }
}
```

### 5.0.3 支付宝 IDE 项目配置

`mini.project.json` 必须存在，且 `miniprogramRoot` 指向当前工程根目录（原生项目无需 dist 转译目录）：

```json
{
  "appid": "",
  "enableAppxNg": true,
  "format": 2,
  "miniprogramRoot": "./",
  "compileType": "miniprogram",
  "compileOptions": {
    "component2": true,
    "typescript": false
  }
}
```

### 5.0.4 网络层规范（原生 my.request）

统一在 `services/request.js` 封装请求，处理以下职责：

1. 拼接 `BASE_URL`（默认 `http://127.0.0.1:3000/api/v1`）
2. 注入 `Authorization: Bearer <accessToken>`
3. 统一解析 `{ code, message, data }` 响应体
4. 命中 401 时调用 `/auth/refresh`，刷新成功后重放原请求
5. 刷新失败则清理本地会话并跳转引导页

示例：

```javascript
// services/request.js
const BASE_URL =
  my.getStorageSync("apiBaseUrl") || "http://127.0.0.1:3000/api/v1";

export function request({ url, method = "GET", data = null, needAuth = true }) {
  const accessToken = my.getStorageSync("mp_student_access_token");
  return new Promise((resolve, reject) => {
    my.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        ...(needAuth && accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      success: async (res) => {
        const body = res.data || {};
        if (res.status === 401) {
          reject({ status: 401, message: "UNAUTHORIZED" });
          return;
        }
        if (body.code !== 0) {
          reject({
            status: res.status,
            code: body.code,
            message: body.message,
          });
          return;
        }
        resolve(body.data);
      },
      fail: (err) =>
        reject({ status: 0, message: err.errorMessage || "NETWORK_ERROR" }),
    });
  });
}
```

### 5.0.5 状态与存储规范

不引入 Zustand 等前端状态库，采用支付宝原生模式：

1. 会话级状态：`app.globalData`
2. 持久化状态：`my.setStorageSync`
3. 页面展示状态：页面 `data`

建议固定存储键：

1. `mp_student_access_token`
2. `mp_student_refresh_token`
3. `mp_student_profile`
4. `referrerStaffId`
5. `referrerStudentId`

## 5.1 目录结构（原生工程）

```text
apps/mp-student/
├── app.js                      # onLaunch 归因捕获、支付宝静默登录入口
├── app.json                    # 路由和 TabBar
├── pages/
│   ├── guide/index.*           # 引导页（未注册时展示）
│   ├── auth/register/index.*   # 注册页（机构码 + 手机号授权）
│   ├── auth/realname/*         # 实名认证（支付宝开放认证跳转）
│   ├── index/index.*           # 课程列表首页
│   ├── course/detail/*         # 课程详情
│   ├── order/confirm/*         # 下单确认
│   ├── order/list/*            # 订单列表
│   ├── order/detail/*          # 订单详情
│   ├── learning/index/*        # 学习中心
│   └── profile/index/*         # 个人中心
├── components/
│   ├── org-code-card/
│   ├── course-card/
│   └── installment-list/
├── services/
│   ├── request.js
│   ├── auth.js
│   ├── course.js
│   ├── order.js
│   └── learning.js
└── utils/
```

## 5.2 鉴权与刷新链路

核心流程：

1. 登录成功写入 token 与 profile
2. 请求时自动带 access token
3. access token 过期后，调用 `/auth/refresh`
4. 刷新成功后重试原请求
5. 刷新失败则清空会话并跳转登录

## 5.3 视频播放页设计（渐进实现）

### Iter 1 骨架

1. 请求 `GET /courses/:courseId/videos`
2. 列表展示章节标题与时长
3. 点击章节弹 `my.showToast({ content: '视频功能即将上线，敬请期待' })`
4. `trial=1` 时只展示第一节并展示试学横幅

### Iter 2 升级

1. 点击章节请求 `GET /courses/videos/:videoId/url`
2. 将 `playUrl` 绑定到原生 `<video>` 组件
3. 播放失败展示错误态并支持重试

## 5.4 人脸打卡预留入口（Iter 3）

1. Iter 1/2 不展示入口
2. Iter 3 在学习页展示「开始打卡」按钮
3. 调用后端 `/learning/checkin/initialize` 拿到 `certifyUrl`，跳转支付宝人脸核身页；完成后调 `/confirm`

---

# 6. 开发推进方案（按页面模块）

> 每个模块完成后暂停，由产品回归测试后再推进下一模块。所有模块均包含前后端任务，完成即可联调验收。

---

## 模块 1：工程骨架 & 网络层

> 目标：在支付宝 IDE 中能打开小程序，前端能调通本地后端的至少一个接口，确认基础设施可用。

### 后端任务

| 任务 | 说明 |
| ---- | ---- |
| DB 迁移：OrgCode / Student（alipayOpenId、phone）/ RefreshToken（studentId FK）/ RealnameRecord / CourseVideo / Course（outline、teacherContact）/ Order（payType、orgCodeId）表变更一次性跑完 | Prisma migrate |
| AppRole 新增 STUDENT，TokenService 扩展 refreshOwner 映射 | common/auth |
| StudentAuthController 骨架注册（路由占位，接口尚未实现） | student-auth |

### 前端任务

| 任务 | 文件 |
| ---- | ---- |
| 初始化 `apps/mp-student` 工程（`app.js` / `app.json` / `app.acss` / `mini.project.json`） | 工程根目录 |
| `mini.project.json` 填入 AppID `2021006157643188` | mini.project.json |
| `app.json` 配置 12 个页面路由与 3 Tab TabBar | app.json |
| `services/request.js` 封装：baseURL 注入、Authorization 头、统一错误解析、401 刷新重试 | services/ |
| `app.js` onLaunch：归因参数捕获（staffId / studentId 写入本地存储），静默登录框架（调用 `POST /auth/silent-login`，失败跳引导页） | app.js |
| 所有页面创建空白骨架文件（axml / acss / js / json），确保 IDE 路由无报错 | pages/ |

### 测试卡点

- 支付宝 IDE 可正常打开项目，TabBar 三个 Tab 切换无报错
- `app.js` onLaunch 静默登录调用 `POST /auth/alipay/login` 返回 200，日志可见 openId

---

## 模块 2：注册 & 登录

> 目标：新用户可通过机构码 + 支付宝手机号授权完成注册并自动跳转实名页；老用户打开小程序静默登录直接进入首页。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `POST /auth/alipay/login` 支付宝 authCode 换 openId，已注册返回 token，未注册返回 `needRegister` | student-auth |
| `POST /auth/alipay/register` authCode + encryptedData + iv 解密手机号 + orgCode 注册新学员 | student-auth |
| `POST /auth/org-code/validate` 机构码校验（含冻结逻辑，按 openId 计次） | student-auth |
| `POST /auth/refresh` Token 刷新 | student-auth |

### 前端任务

| 任务 | 页面/组件 |
| ---- | --------- |
| `app.js` onLaunch：调用 `my.login()` → `POST /auth/alipay/login`，已注册跳首页，未注册跳引导页 | app.js |
| 引导页（仅「立即注册」一个入口） | pages/guide |
| 注册页：机构码输入 + 校验卡片 + 「授权手机号并注册」按钮（支付宝原生授权组件） | pages/auth/register |
| 机构码校验卡片组件（展示机构名 + 业务员名） | components/org-code-card |

### 测试卡点

- 已注册用户打开小程序，无任何弹框直接进入首页（静默登录）
- 未注册用户打开小程序，展示注册引导页
- 输入无效机构码展示正确错误提示，同一账号失败 5 次后冻结 30 分钟
- 点击「授权手机号」→ 支付宝弹出授权确认 → 注册成功跳实名认证页
- 拒绝授权时提示需要授权才能注册，按钮保持可点击
- Access token 过期后自动刷新，请求无感重试

---

## 模块 3：实名认证

> 目标：已登录用户可提交实名信息，未成年人被拦截，认证成功后个人中心展示「✓ 已实名」。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `POST /users/realname` 实名信息提交（格式校验 + 年龄拦截 + idNo hash 存储） | user |

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 实名认证页（姓名 / 身份证 / 手机号三字段表单，格式校验） | pages/auth/realname |

### 测试卡点

- 身份证号不足 18 位时提交按钮禁用
- 未成年人（身份证号推算年龄 < 18 岁）提交后展示拦截提示
- 认证成功 toast 后跳转首页，个人中心展示「✓ 已实名」

---

## 模块 4：课程发现

> 目标：学员可搜索浏览课程列表，查看课程详情，未登录也可浏览但点击详情后跳转登录。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `GET /courses` 课程列表（关键词搜索 + 分页） | student/course |
| `GET /courses/:courseId` 课程详情 | student/course |

### 前端任务

| 任务 | 页面/组件 |
| ---- | --------- |
| 课程列表页（搜索框 + 分页加载 + 空状态） | pages/index |
| 课程卡片组件（名称 / 机构 / 每期价格 / 先学后付徽标） | components/course-card |
| 课程详情页（大纲 / 分期方案 / 合规声明 / 报名按钮 / 购课须知弹框） | pages/course/detail |

### 测试卡点

- 未登录时可浏览列表，点击课程卡片跳转登录页
- 登录后可进入课程详情，首次点击「立即报名」弹购课须知
- 关键词搜索结果正确，无结果展示空状态

---

## 模块 5：下单流程

> 目标：学员可对已看详情的课程发起下单，创建订单后跳转订单详情页。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `POST /orders` 创建订单（RealnameGuard 拦截 + UNDERAGE / PRICE_LIMIT 错误处理） | student/order |
| 电子签约接口占位 `POST /orders/:orderId/sign/initialize` 返回 501 | student/order |

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 下单确认页（课程名 / 付款方式说明 / 确认按钮） | pages/order/confirm |

### 测试卡点

- 未实名用户点击下单时，后端返回 RealnameGuard 错误，前端提示「请先完成实名认证」
- 先学后付 / 立即付款两种 payType 均可创建订单，返回 orderId
- 创建成功后跳转订单详情页，订单状态为 CREATED

---

## 模块 6：订单管理

> 目标：学员可查看所有订单及其分期明细；CREATED 状态下签约按钮展示占位提示。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `GET /orders` 订单列表 | student/order |
| `GET /orders/:orderId` 订单详情（含 installments 数组） | student/order |

### 前端任务

| 任务 | 页面/组件 |
| ---- | --------- |
| 订单列表页（状态标签配色 / 空状态 / 跳转详情） | pages/order/list |
| 订单详情页（课程信息 / 状态操作区 / 签约占位按钮） | pages/order/detail |
| 分期明细组件（期次 / 到期日 / 金额 / 状态标签） | components/installment-list |

### 测试卡点

- 订单列表按创建时间倒序，各状态标签颜色正确
- CREATED 状态下点击「签约授权」按钮显示「签约功能即将上线」Toast
- ACTIVE 状态下展示「去学习」按钮，分期明细可见
- 无订单时展示空状态与「去看看课程」跳转

---

## 模块 7：学习中心（骨架）

> 目标：学习页可展示章节列表，点击章节有占位提示；试学模式仅展示第一节。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `GET /courses/:courseId/videos` 视频章节列表（trial 参数过滤） | student/course |
| 视频播放地址接口占位 `GET /courses/videos/:videoId/url` 返回 501 | student/course |
| 人脸打卡接口占位 `POST /learning/checkin` 返回 501 | student/learning |

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 学习中心页：章节列表渲染，点击 Toast「视频功能即将上线」 | pages/learning/index |
| trial=1 时顶部横幅 + 底部报名引导卡片 | pages/learning/index |
| 联系老师区域（微信号 / 电话） | pages/learning/index |

### 测试卡点

- 进入学习页展示章节列表（标题 / 时长占位）
- 点击任意章节 Toast 提示「视频功能即将上线，敬请期待」
- trial=1 时只展示第一节，顶部黄色横幅可见，底部有购课入口

---

## 模块 8：个人中心

> 目标：已登录用户可查看个人信息、实名状态；未实名时有橙色引导入口；退出登录正常清除会话。

### 后端任务

无新增接口，复用登录时返回的 `StudentProfile`。

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 个人中心页（头像首字 / 姓名 / 手机号 / 实名状态徽标） | pages/profile/index |
| 未实名时「完成实名认证」橙色菜单项，点击跳转实名页 | pages/profile/index |
| 「我的课程」菜单跳订单列表 | pages/profile/index |
| 退出登录（清空本地 token，跳首页 Tab，重新触发静默登录） | pages/profile/index |
| 未登录态展示「去登录」提示 | pages/profile/index |

### 测试卡点

- 已实名用户姓名旁显示「✓ 已实名」，未实名入口不出现
- 未实名用户个人中心橙色入口可见，点击跳转实名页
- 退出登录后 token 清除，个人中心切换为未登录态

---

## 模块 9：电子签约（法大大/e签宝，所有订单）+ 芝麻先享授权（DEFERRED 订单）

> 目标：所有订单通过第三方电子签约服务完成身份核验与合同留痕；DEFERRED 订单在签约完成后额外发起芝麻先享授权扣款，两步都完成后订单变为 ACTIVE。
>
> **设计原则：** 电子签约使用平台无关的第三方服务商（法大大/e签宝），不依赖支付宝核身，
> 保证未来迁移微信小程序或 H5 时签约能力不受影响。芝麻先享仅作为 Alipay 端的支付机制。

---

### 前置条件（非技术）

| 项目 | 状态 | 说明 |
| ---- | ---- | ---- |
| 小程序上架 | 待上线 | **守约链接依赖小程序上架**（见下方） |
| 支付宝开放平台申请芝麻先享权限 | 待申请 | 需提交业务场景、守约链接（小程序订单列表页 scheme）|

---

### 守约链接方案

> **守约链接（信用服务守约链接）** 支付宝官方定义：用户在守约页面点击「去支付」后，跳转到**商家小程序内的订单列表页面地址**。此链接用于承接对客移动端「去支付」按钮的跳转。
>
> 关键认知（2026-06-26 修正）：守约链接**必须是小程序页面 scheme，不是 H5**。此前规划的「H5 临时方案」基于错误理解，已废弃。

#### 配置值（唯一方案）

```
alipays://platformapi/startapp?appId=2021006157643188&page=pages%2Forder%2Flist%2Findex
```

- `appId=2021006157643188` —— 学员小程序 AppID
- `page` —— URL 编码后的订单列表页路径 `pages/order/list/index`
- 用户落到订单列表页后，自行点进逾期订单 → 订单详情页「立即还款」完成履约

#### 用户履约路径

```
芝麻信用「待履约」页 → 点「去支付」
  → 守约链接跳转 → 小程序订单列表页 (pages/order/list/index)
  → 点击逾期订单 → 订单详情页 (pages/order/detail/index)
  → 「立即还款」→ my.tradePay → 履约完成
```

#### 依赖顺序

```
小程序上架 → 拿到可用的 page scheme → 申请/配置芝麻先享守约链接 → 上线
```

> 守约链接指向的订单列表页已实现，**无需额外代码**。芝麻信用页上展示的待付款金额、订单号、商家名等，均由 `creditbizorder.create` 传入的参数自动渲染，由支付宝侧页面承载，商家无需自建页面。

---

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| DB 迁移：新增 `SignRecord` 表（provider / flowId / status / signedAt）；`Order` 新增 `signRecordId`、`creditBizOrderId` 字段 | db |
| `POST /orders/:orderId/sign/initialize`：创建第三方签约流程，返回 `{ signUrl }` | student/order |
| `POST /orders/:orderId/sign/confirm`：查询第三方结果，SIGNED → 更新 SignRecord | student/order |
| `POST /orders/:orderId/zhima/initialize`（DEFERRED）：校验已签约 → 调用 creditbizorder.create，返回 `{ scheme }` | student/order |
| `POST /orders/:orderId/zhima/confirm`（DEFERRED）：查询 creditbizorder → SIGNED → Order ACTIVE + 批量创建 Installment | student/order |
| `POST /orders/zhima/notify`：验签 → 更新 Installment 状态（PAID/OVERDUE）→ 末期 PAID 时 Order COMPLETED | student/order |
| 逾期还款：`POST /orders/:orderId/installments/:periodNo/repay` → 返回 `tradeNo` | student/order |

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 订单详情页状态机：待签约 → 签约中 → 待授权（DEFERRED）→ 授权中 → ACTIVE | pages/order/detail |
| 「签约授权」按钮：调用 sign/initialize，WebView/跳转打开 `signUrl`，返回后调用 sign/confirm | pages/order/detail |
| DEFERRED 订单签约完成后显示「芝麻先享授权」按钮：调用 zhima/initialize，`my.ap.navigateToAlipayPage(scheme)`，`onShow` 后调用 zhima/confirm | pages/order/detail |
| 逾期状态展示 + 「立即还款」→ repay 接口 → `my.tradePay` | pages/order/detail |

### DEFERRED 订单激活完整流程

```
用户点击「签约授权」
  → sign/initialize（第三方签约链接）
  → 用户在第三方页完成人脸核身 + 签约
  → onShow → sign/confirm（SignRecord SIGNED）
  → 显示「芝麻先享授权」按钮
  → zhima/initialize（芝麻先享 scheme）
  → 用户在支付宝芝麻页完成授权
  → onShow → zhima/confirm（Order ACTIVE）
  → 显示「去学习」按钮
```

### 测试卡点

- 电子签约跳转第三方页面，核身通过后返回 SignRecord SIGNED
- DEFERRED 订单：签约后显示芝麻授权按钮，授权完成后 Order 变为 ACTIVE
- IMMEDIATE 订单：签约后等待支付激活（Iter3），不出现芝麻授权入口
- 取消任意步骤后，页面仍显示当前未完成步骤的操作按钮，可重试
- 芝麻 notify 正确更新 Installment，逾期时「立即还款」可见

---

## 模块 10：视频播放（点播对接）

> 目标：学员可在学习页播放视频；试学模式仅第一节可播；播放地址带签名鉴权。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| `GET /courses/videos/:videoId/url` 对接腾讯云 VOD / 阿里云点播，返回签名播放地址（替换 501） | student/course |

### 前端任务

| 任务 | 页面/组件 |
| ---- | --------- |
| 学习中心页：点击章节请求播放地址，绑定原生 `<video>` 组件 | pages/learning/index |
| 播放失败错误态 + 重试按钮 | pages/learning/index |

### 测试卡点

- 点击章节后视频正常播放，地址来自后端签名（不可直接访问）
- 试学模式下仅第一节可播，其他章节提示购课
- 播放失败时展示错误提示与重试按钮

---

## 模块 11：人脸打卡激励

> 目标：学习页开放人脸打卡入口（`datadigital.fincloud.generalsaas.face.certify.*`），打卡成功获得学费抵扣激励。实名认证已在模块 3 完成，本模块无需再接入任何实名接口。

### 后端任务

| 任务 | 模块 |
| ---- | ---- |
| DB 迁移：新增 CheckinRecord 表（certifyId + checkedAt） | db |
| `POST /learning/checkin/initialize`：调用 `datadigital.fincloud.generalsaas.face.certify.initialize` → `face.certify.verify`，返回 `{ certifyId, certifyUrl }` | student/learning |
| `POST /learning/checkin/confirm`：调用 `datadigital.fincloud.generalsaas.face.certify.query`，通过后写 CheckinRecord + 激励抵扣记录（替换 501） | student/learning |
| 打卡激励抵扣 Installment 逻辑 | student/learning |

### 前端任务

| 任务 | 页面 |
| ---- | ---- |
| 学习中心页：展示「开始打卡」按钮（取消占位注释） | pages/learning/index |
| 调用 initialize 接口，拿到 `certifyUrl`，通过 `my.ap.navigateToAlipayPage` 跳转支付宝人脸核身页 | pages/learning/index |
| 用户完成返回后调用 confirm 接口，展示打卡结果（成功 + 激励金额 / 失败 / 次数超限） | pages/learning/index |

### 测试卡点

- 点击「开始打卡」跳转至支付宝人脸核身页面
- 打卡成功展示激励金额，再次进入订单详情可见抵扣记录
- 单期次打卡超限后提示「今日打卡次数已用完」

---

# 10. 可执行检查清单（开工前）

## 10.1 文档一致性

1. PRD 与技术方案均以“支付宝原生小程序”作为唯一前端路线。
2. 所有前端术语已统一为原生目录（`app.js`、`app.json`、`pages/*`、`components/*`）。
3. 接口路径与字段与后端方案一致（前后端对同一 DTO 命名）。

## 10.2 工程可运行性

1. `apps/mp-student/mini.project.json` 存在且 `miniprogramRoot` 正确。
2. `apps/mp-student/app.json` 路由可在支付宝 IDE 正常识别。
3. 后端本地可启动并访问 `http://127.0.0.1:3000/api/v1`。
4. MySQL 与 Redis 容器可用，后端本地日志可输出 authCode 换取的 openId。

## 10.3 联调最小闭环

1. 支付宝静默登录：`POST /auth/alipay/login`（authCode 换 openId，日志可见）。
2. 机构码校验：`POST /auth/org-code/validate`。
3. 手机号授权注册：`POST /auth/alipay/register`（encryptedData + iv 解密后写库）。
4. 课程列表：`GET /courses`。
5. 创建订单：`POST /orders`。

## 10.4 验收标准可执行性

1. Iter 1 每个页面均有明确入口、请求接口、失败提示。
2. 所有“占位能力”（签约、视频播放地址、打卡）均有 501 语义与前端提示策略。
3. 错误码映射文案在前端侧可落地（至少覆盖 40001/40002/40003/40005/40101/40102）。

---

# 7. 关键安全设计

| 风险点             | 措施                                                        |
| ------------------ | ----------------------------------------------------------- |
| 机构码防暴力       | 24h 失败 5 次冻结 30min，按 openId 计次，记录至 Redis       |
| JWT 安全           | access token 有效期 15min，refresh token 7天；revoke 时写库 |
| 支付宝回调验签     | alipay-sdk-nodejs 强制校验支付宝公钥签名，不可绕过          |
| 视频防盗链         | 播放地址服务端签名，有效期 1h，不允许前端缓存（Iter 2）     |
| 核身 certifyId     | 后端初始化后立即存库，confirm 时校验所属 studentId，防篡改  |
| 实名信息           | 接口层脱敏日志，certifyId 关联支付宝核身结果，不本地存身份证号 |
| 接口访问控制       | 所有学员数据接口强制 studentId 范围，禁止越权查询他人订单   |

---

# 8. 可观测性设计

| 链路         | 埋点/日志                                           | 说明                        |
| ------------ | --------------------------------------------------- | --------------------------- |
| 注册转化漏斗 | 进入引导页 → 机构码校验成功 → 手机号授权 → 注册成功 | 前端打点                    |
| 登录方式分布 | 静默登录成功 / 静默登录失败跳注册 各自上报           | 前端打点                    |
| 错误码频率   | 每个业务错误码上报计数                              | 后端 Interceptor + 监控系统 |
| 关键操作审计 | 实名认证、创建订单、签约、打卡 写入 AuditLog 表     | 后端                        |
| 接口延迟监控 | P95 ≤ 500ms 告警                                    | 后端 Prometheus / 日志系统  |

---

# 9. 环境变量补充

在现有 `.env` 基础上，模块 1 开工前需配置：

```env
# JWT
STUDENT_JWT_SECRET=<your-secret>
STUDENT_JWT_ACCESS_TTL=900          # 15分钟（秒）
STUDENT_JWT_REFRESH_TTL=604800      # 7天（秒）

# 支付宝小程序（AppID：2021006157643188）
ALIPAY_APP_ID=2021006157643188
ALIPAY_PRIVATE_KEY=<应用私钥，RSA2>
ALIPAY_PUBLIC_KEY=<支付宝公钥>

# Redis（限流计数）
REDIS_URL=redis://localhost:6379
```

> `REDIS_URL` 为必需项，`RateLimitStoreService` 启动时会检查连接，缺失将导致服务启动失败。本地开发可使用 Docker：`docker run -d -p 6379:6379 redis:7-alpine`。
>
> 阿里云 SMS 相关变量已移除，不再需要。

模块 10（视频播放）新增：

```env
# 腾讯云 VOD（或阿里云点播）
VOD_SECRET_ID=<your-secret-id>
VOD_SECRET_KEY=<your-secret-key>
VOD_APP_ID=<your-app-id>
VOD_PLAY_KEY=<your-play-key>
VOD_URL_EXPIRE_SEC=3600
```
