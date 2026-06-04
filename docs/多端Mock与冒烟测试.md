# 多端 Mock 与冒烟测试

## 1. 目标与范围

当前默认方案已经切换为 API mock：四个前端在开发时默认请求真实接口地址，由 Nest API 在 `MOCK_API=true` 时统一返回共享 mock 状态，用于覆盖以下链路：

- 平台后台：机构审核、暂停、GMV 报表、系统配置
- 机构后台：课程管理、订单筛选、逾期核销、结算查看
- 学员小程序：扫码进入、登录、实名、选课、下单、签约、冷静期退课、学习打卡、拉新奖励
- 业务员小程序：登录、工作台、学员列表、提成看板、个人页

当前仍保持 mock 结果的能力：

- 支付与代扣
- 合同签署跳转
- 信用授权
- 人脸核验

这些场景已经在页面上有结果态，但不会发起真实支付或扣款。

## 2. 启动方式

推荐启动方式：先启动 API mock，再启动任意前端。无需数据库。

API mock：

如果你当前在仓库根目录：

```bash
pnpm dev:api:mock
```

如果你当前已经在 apps/api 目录：

```bash
pnpm dev:api:mock
```

如果你想直接跑一次编译后的 mock API，可用：

如果你当前在仓库根目录：

```bash
pnpm start:api:mock
```

如果你当前已经在 apps/api 目录：

```bash
pnpm start:api:mock
```

免登录说明：

- 只要 API 是以 `MOCK_API=true` 启动，mock 现在会默认绕过登录态校验
- 这意味着像 `/api/v1/admin/staff`、`/api/v1/org/qa`、`/api/v1/admin/report/health` 这类接口，在开发联调时即使不带 token 也会直接返回 mock 数据
- 如果你后面想恢复“必须先登录后再访问 mock 接口”，可在启动前显式设置 `MOCK_API_BYPASS_AUTH=false`

持久化说明：

- API mock 会把共享状态和登录会话自动保存到 apps/api/mock-data/mock-api-state.json
- 重启 `pnpm dev:api:mock` 后，会优先加载这份文件，而不是重新回到默认场景
- 这意味着你在某个端完成的审批、下单、签约、退课、逾期核销等动作，重启后仍然保留
- 如果你想自定义保存位置，可在启动前设置 `MOCK_API_STATE_FILE`

如果你要切回真实 API：

```bash
pnpm dev:api
```

说明：

- 当前四个前端默认会请求 API，不再默认使用各自本地 mock。
- 如果你临时还想退回旧的前端本地 mock，可手动传入前端开关。
- Web 端开关：`VITE_USE_FRONTEND_MOCK=true`
- 小程序端开关：`TARO_APP_USE_FRONTEND_MOCK=true`

如果你想强制从空白初始状态重新开始，可删除持久化文件后再启动：

```bash
rm -f apps/api/mock-data/mock-api-state.json
pnpm dev:api:mock
```

Web 端：

```bash
pnpm dev:web-admin
pnpm dev:web-institution
```

学员小程序：

```bash
pnpm dev:mp-student
pnpm dev:mp-student:alipay
```

业务员小程序：

```bash
pnpm dev:mp-staff
pnpm dev:mp-staff:alipay
```

如果要做一次静态编译校验，可使用：

```bash
cd apps/web-admin && pnpm build
cd apps/web-institution && pnpm build
cd apps/mp-student && pnpm exec tsc --noEmit
cd apps/mp-staff && pnpm exec tsc --noEmit
```

## 3. 内置场景数据

### 场景 A：平台审核与机构准入

- 待审核机构：星火职训中心
- 已入驻机构：青禾设计学院、知行电商学堂
- 已暂停机构：远航短视频训练营
- 已退出机构：旧梦考证课堂

覆盖页面：

- web-admin 登录页、运营概览、机构管理、数据报表、系统配置

### 场景 B：学员首次报名

- 邀请来源业务员：staff-demo-001
- 新学员：stu-mock-001
- 课程：UI 设计商业实战营、短视频剪辑增长课、AI 办公效率班
- 新建订单状态：CREATED

覆盖页面：

- mp-student 邀请拦截页、登录页、实名页、首页、课程详情、订单详情

### 场景 C：冷静期退课

- 订单：order-cooling-001
- 状态：COOLING_OFF
- 预期动作：签约后可在 7 天内退课，退课后变为 REFUNDED

覆盖页面：

- mp-student 订单详情
- web-institution 订单管理

### 场景 D：正常履约与学习激励

- 订单：order-active-001 / stu-order-active-001
- 分期状态：PAID、DELIVERED、OVERDUE 混合
- 学习激励：已有历史激励 + 新增打卡奖励

覆盖页面：

- mp-student 订单详情、学习进度、打卡页
- web-institution 订单管理、概览页

### 场景 E：逾期与坏账核销

- 机构侧逾期订单：order-active-001
- 逾期分期：第 3 期
- 业务员提成状态：HELD

覆盖页面：

- web-institution 逾期管理
- mp-staff 提成看板、学员列表

### 场景 F：拉新与提成

- 学员邀请奖励：1 条已发放、2 条待发放
- 业务员提成：SETTLED、PENDING、HELD、CLAWED_BACK 全覆盖

覆盖页面：

- mp-student 邀请奖励页
- mp-staff 工作台、提成页

## 4. 场景切换接口

API mock 提供了共享场景切换接口，便于你在不改前端代码的前提下切状态。

查看可用场景：

```bash
curl http://localhost:3000/api/v1/mock/scenarios
```

查看当前摘要：

```bash
curl http://localhost:3000/api/v1/mock/summary
```

切到新学员首登场景：

```bash
curl -X POST http://localhost:3000/api/v1/mock/scenario \
	-H 'Content-Type: application/json' \
	-d '{"scenario":"new-user"}'
```

切到高风险逾期场景：

```bash
curl -X POST http://localhost:3000/api/v1/mock/scenario \
	-H 'Content-Type: application/json' \
	-d '{"scenario":"risk"}'
```

重置当前场景：

```bash
curl -X POST http://localhost:3000/api/v1/mock/reset
```

说明：

- `/mock/scenario` 会切换到指定场景，并把新的状态写回持久化文件
- `/mock/reset` 会把当前场景重置为该场景的初始状态，并覆盖持久化文件
- 场景切换和重置会清空当前 mock 登录会话，因此建议切换后重新登录四个端

当前内置场景：

- `default`：混合履约场景，适合日常全链路冒烟
- `new-user`：新学员首登、未实名、从邀请进入开始
- `risk`：逾期偏多、机构风控压力更高的场景

## 5. 推荐冒烟顺序

建议按下面顺序执行，最快覆盖完整业务闭环。

### 用例 1：平台后台基础巡检

入口：web-admin

步骤：

1. 使用开发账号进入平台后台。
2. 打开运营概览，确认回收率、逾期率、退课率卡片正常显示。
3. 进入机构管理，确认能看到待审核、已入驻、已暂停、已退出四类机构。
4. 对星火职训中心点击“审核通过”，设置费率后列表刷新为已入驻。
5. 对青禾设计学院点击“暂停”，确认状态切换为已暂停。
6. 进入数据报表，切换月份，确认 GMV、平台服务费、机构表格都随月份变化。
7. 进入系统配置，调整客单价上限与芝麻开关，确认保存提示成功。

预期：

- 页面不回登录页
- 列表和卡片均有数据
- 审核、暂停、配置保存均能即时反馈

### 用例 2：机构后台运营巡检

入口：web-institution

步骤：

1. 使用开发账号进入机构后台。
2. 在概览页确认订单、学习中学员、GMV、最近订单可展示。
3. 进入课程管理，确认在线/下线课程混合存在。
4. 新建一门课程，确认课程出现在列表顶部，默认状态为已下线。
5. 对任一课程点击上线或下线，确认状态切换成功。
6. 进入订单管理，分别筛选学习中、冷静期、已完成、已退课。
7. 进入逾期管理，对一条逾期记录执行核销坏账，确认该记录从逾期表格消失。
8. 进入结算对账，确认保证金余额、已缴服务费和结算明细可见。

预期：

- 订单状态至少覆盖 ACTIVE、COOLING_OFF、COMPLETED、REFUNDED
- 逾期列表能看到 OVERDUE 分期
- 结算明细至少覆盖 PENDING 和 SETTLED

### 用例 3：学员首次进入到实名完成

入口：mp-student

步骤：

1. 先进入邀请拦截页。
2. 在开发模式快速入口输入或保持默认业务员 ID，点击“模拟扫码进入”。
3. 进入首页后，点击任意课程，若未登录则会跳到登录页。
4. 完成微信或支付宝登录，首次登录应进入实名认证页。
5. 用成年身份证号完成实名认证。
6. 成功后返回首页。

建议实名测试数据：

- 姓名：林一
- 身份证：110105199701015678
- 手机号：13800138000

预期：

- 未登录学员无法直接下单
- 首次登录默认走实名流程
- 实名成功后个人页显示已实名

### 用例 4：学员选课、下单、签约、冷静期退课

入口：mp-student

步骤：

1. 首页搜索“短视频”或“AI”，确认课程搜索可用。
2. 进入课程详情，核对期数、总价、机构名称和课程介绍。
3. 点击“立即报名（先学后付）”，创建新订单。
4. 在订单详情页确认初始状态为 CREATED。
5. 点击“签约并授权代扣”，确认状态切到 COOLING_OFF。
6. 再点击“申请退课（冷静期）”，确认状态切到 REFUNDED。
7. 返回“我的课程”，确认该订单显示为已退课。

预期：

- 创建订单后会进入订单详情
- 签约结果和退课结果都立即反馈到列表
- 页面上显示的是 mock 的签约/代扣结果，不会触发真实支付

### 用例 5：学员学习与激励

入口：mp-student

步骤：

1. 打开已存在的学习中订单。
2. 在订单详情确认分期计划中同时存在已还款、待扣款、逾期三类状态。
3. 点击“去学习”。
4. 在学习进度页确认学习激励余额、累计打卡次数、课程进度可见。
5. 点击“扫脸打卡领激励”。
6. 首次打卡应成功，再次打卡同一期会走失败分支。

预期：

- 激励余额会增加
- 打卡结果页能看到成功或失败两类状态
- 这里的人脸结果是 mock，不调用真实核身接口

### 用例 6：学员拉新奖励

入口：mp-student

步骤：

1. 进入个人页，打开“邀请好友赚奖励”。
2. 查看邀请记录，确认至少有已发放和待发放两类记录。
3. 点击“立即邀请好友”，确认弹出分享提示。

预期：

- 已获奖励金额正确汇总已发放记录
- 邀请记录时间和状态可正常渲染

### 用例 7：业务员工作台与提成

入口：mp-staff

步骤：

1. 完成微信或支付宝登录。
2. 进入首页，确认已结算、待结算、暂缓提成三张卡片有值。
3. 进入提成页，确认明细包含 SETTLED、PENDING、HELD、CLAWED_BACK 四种状态。
4. 进入学员页，确认至少覆盖学习中、冷静期、已完成、已逾期四类订单状态。
5. 进入个人页，确认能看到业务员姓名、手机号、合同类型和组别。

预期：

- 登录后 storage 中有 staff_token、staff_id、staff_profile
- 工作台与提成页使用同一份 mock 业务员数据

## 6. 全流程串测建议

如果要按“业务故事”串起来跑，建议用下面这条主线：

1. 在 web-admin 查看机构状态与平台配置。
2. 在 web-institution 确认课程在线、订单履约和逾期处理能力。
3. 在 mp-staff 以业务员身份查看自己的学员和提成。
4. 在 mp-student 以学员身份完成邀请进入、实名、下单、签约、退课或学习。
5. 回到 web-institution 对照订单状态与逾期处置页面。
6. 回到 mp-staff 对照提成状态和名下学员状态。

注意：

- 当前 mock 已上收到 API 层，四个前端共享同一份内存状态。
- 这意味着你可以先在一个端完成操作，再到另一个端查看同一批 mock 数据。
- 但它仍然是开发期内存 mock：重启 `dev:api:mock` 后状态会重置。

## 7. 本次重点覆盖的状态清单

- 机构：PENDING、ACTIVE、SUSPENDED、EXITED
- 课程：ONLINE、OFFLINE
- 订单：CREATED、COOLING_OFF、ACTIVE、COMPLETED、REFUNDED
- 分期：PENDING、DELIVERED、PAID、OVERDUE、WRITTEN_OFF
- 提成：PENDING、SETTLED、HELD、CLAWED_BACK
- 拉新奖励：PENDING、PAID

只要上述状态在页面中都能看见并且关键操作有反馈，这一轮多端 smoke 就算通过。
