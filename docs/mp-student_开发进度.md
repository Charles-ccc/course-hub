# mp-student 开发进度

> 按模块顺序推进，每个模块完成后由产品回归测试，确认通过后打勾继续下一模块。

---

## 模块 1：工程骨架 & 网络层

### 后端

- [x] DB 全量迁移（OrgCode / Student / RefreshToken / RealnameRecord / CourseVideo / Course / Order 表变更）
- [x] AppRole 新增 STUDENT，TokenService 扩展 refreshOwner 映射
- [x] StudentAuthController 骨架注册（路由占位）
- [x] `POST /auth/alipay/login` 骨架可用，dev 环境日志输出 openId（authCode 换取）

### 前端

- [x] 初始化 `apps/mp-student` 工程（app.js / app.json / app.acss / mini.project.json）
- [x] `mini.project.json` 填入 AppID `2021006157643188`
- [x] `app.json` 配置 10 个页面路由与 3 Tab TabBar
- [x] `services/request.js` 封装（baseURL / Authorization 头 / 统一错误解析 / 401 刷新重试）
- [x] `app.js` onLaunch：归因参数捕获 + 静默登录框架
- [x] 所有页面创建空白骨架文件，IDE 路由无报错

### 测试卡点

- [x] 支付宝 IDE 可正常打开，TabBar 三个 Tab 切换无报错
- [x] `app.js` onLaunch 静默登录调用 `POST /auth/alipay/login` 返回 201，后端日志可见 openId

---

## 模块 2：注册 & 登录

### 后端

- [x] `POST /auth/alipay/login`（authCode 换 openId，已注册返回 token，未注册返回 needRegister）
- [x] `POST /auth/alipay/register`（authCode + encryptedData + iv 解密手机号 + orgCode 注册）
- [x] `POST /auth/org-code/validate`（机构码校验，含冻结逻辑；按 openId 计冻结次数）
- [x] `POST /auth/student/refresh`（Token 刷新，路由与前端 request.js 一致）

### 前端

- [x] `app.js` onLaunch：调用 `my.login()` → `POST /auth/alipay/login`，已注册跳首页，未注册跳引导页
- [x] 引导页（仅「立即注册」一个入口）
- [x] 注册页：机构码输入 + 校验卡片 + 「授权手机号并注册」按钮（支付宝原生授权组件）
- [x] 机构码校验卡片组件（展示机构名 + 业务员名）

### 测试卡点

- [x] 已注册用户打开小程序，无任何弹框直接进入首页（静默登录）
- [x] 未注册用户打开小程序，展示注册引导页
- [x] 输入无效机构码展示正确错误提示，同一账号失败 5 次后冻结 30 分钟
- [x] 点击「授权手机号」→ 支付宝弹出授权确认 → 注册成功跳实名认证页
- [x] 拒绝授权时提示需要授权才能注册，按钮保持可点击
- [x] Access token 过期后自动刷新，请求无感重试

---

## 模块 3：实名认证（暂跳过，并入模块 9 一起做）

> **决策（2026-06-24）：** 本 AppID `2021006157643188` 调用 `alipay.user.certify.open.*` 持续返回 UNKNOWN_ERROR（开放平台「配置项检测」全过但 API 路径实际未下发；同样的入参喂给 `datadigital.fincloud.generalsaas.face.certify.*` 可以 `code:10000`）。注册流程不再卡实名，只需业务员码 + 支付宝授权手机号即可注册；实名认证留到模块 9（电子签约）一起用 web-view + datadigital 方案打通。
>
> **已落地的占位：** `/users/realname/initialize` `/users/realname/confirm` `/users/realname/callback` 路由已在后端保留；前端 `pages/auth/realname` 和 `pages/auth/realname-webview` 页面已搭好，等模块 9 时直接复用。`REALNAME_BYPASS` 环境变量当前置 0，不影响流程（注册流程已绕开实名）。

### 后端

- [x] ~~实名认证三接口（initialize / confirm / callback）骨架已搭~~
- [ ] 等模块 9 一起跑通 datadigital + web-view

### 前端

- [x] ~~实名认证页 + web-view 兜底页骨架已搭~~
- [ ] 模块 9 复用

---

## 模块 4：课程发现

> **新增范围（2026-06-24）：** 启动方式从「静默登录」改为「显式登录页」，未登录不可进入小程序。`Course` 模型新增 `imageUrl String?` 字段（DB 已迁移），课程卡片预留封面位。分页规约统一为 `page` + `pageSize`，响应 `{ items, page, pageSize, total, hasNext }`，已重构 staff DTO 引用公共 `PageQueryDto` / `PageResult<T>`。

### 后端

- [x] `GET /courses`（关键词模糊匹配 name/description + 分页，只返回 status=ONLINE & auditStatus=APPROVED）
- [x] `GET /courses/:courseId`（课程详情）
- [x] 公共分页 DTO `apps/api/src/common/dto/page.dto.ts`（PageQueryDto + PageResult + buildPageResult）
- [x] Course schema 加 `imageUrl String?` 字段并 db push 到生产 + Prisma 客户端重新生成

### 前端

- [x] 登录页 `pages/auth/login`（去掉静默登录，启动只看本地是否有 token）
- [x] splash 改路由：有 token → 首页，无 token → 登录页
- [x] request.js 401 路由改为登录页
- [x] 注册页注册成功后跳首页（之前跳实名）
- [x] 课程卡片公共组件 `components/course-card/`（封面占位 + 课程信息 + 先学后付徽标）
- [x] 首页：搜索框 + 列表 + 触底加载 + 空状态 + 下拉刷新
- [x] 课程详情页：封面 + 课程信息 + 大纲 + 合规声明 + 付款方式单选 + 试学/报名按钮 + 购课须知 Modal

### 测试卡点

- [x] 启动小程序：无 token → 显示登录页；点支付宝授权登录 → 已注册进首页，未注册跳引导页
- [x] 首页关键词搜索正确，无结果展示空状态，触底加载下一页
- [x] 点击课程卡片跳详情页，详情展示课程信息+大纲+合规声明
- [x] 切换付款方式 / 试学按钮跳学习页 / 首次「立即报名」弹购课须知，确认后跳订单确认页

---

## 模块 5：下单流程

> **决策（2026-06-25）：**
>
> - 允许重复下单（同一学员 × 同一课程可创建多个订单，异常由后台管理员处理）。
> - 分期日期：`dueDate = createdAt + periodNo × 30 天`。
> - 移除冷静期：`COOLING_OFF` 状态不再使用，`coolingOffEndAt` 不写入。
> - 购课须知弹窗文案更新：「本课程提供免费试学，建议先试学后再下单。下单即视为您已体验并认可课程内容，购课后不支持退课退款，请确认。」变量名 `trialConfirmed` → `enrollConfirmed`。
> - 暂不做实名拦截（Module 9 签约时再加）；`studentName` 取 `student.name`，null 时兜底 `student.phone`。

### 后端

- [x] `POST /orders`（验证课程状态 → 创建 Order → 生成 Installment → 返回 orderId）
- [x] `GET /orders/:orderId`（订单详情 + installments 列表）
- [x] `POST /orders/:orderId/sign/initialize` → 返回 501（占位）

> 后端冒烟测试已通过（2026-06-25）：DEFERRED 12 期金额合计校验一致、每期 30 天；IMMEDIATE 1 期全额；签约接口 501；无 token 401；不存在课程 40010。

### 前端

- [x] 课程详情页购课须知弹窗文案 & 变量名更新（`trialConfirmed` → `enrollConfirmed`，payType 对齐后端 `IMMEDIATE`/`DEFERRED`）
- [x] 下单确认页 `pages/order/confirm/index`（课程信息 / 付款方式说明 / 确认按钮）
- [x] 订单详情页 `pages/order/detail/index`（基础版：订单状态 / 分期明细 / 签约占位按钮）

### 测试卡点

- [x] DEFERRED 下单：生成 N 条 Installment，每期 30 天，金额均分（末期吸收余数）
- [x] IMMEDIATE 下单：生成 1 条 Installment，全额
- [x] 订单详情页展示课程名、总价、期数、payType 说明
- [x] 点击「签约授权」toast「签约功能即将上线，敬请期待」
- [x] 课程不存在 / 已下架时返回合适错误提示

---

## 模块 6：订单管理

> **决策（2026-06-25）：** 最简版个人中心（Option A）：头像首字 + 姓名/手机号 + 「我的课程」入口 + 退出登录。完整版留到模块 8。

### 后端

- [x] `GET /orders`（订单列表，按 createdAt desc，无分页）
- [x] `GET /orders/:orderId`（订单详情，含 installments 数组，模块 5 已完成）

### 前端

- [x] 订单列表页 `pages/order/list/index`（状态标签配色 / 空状态 + 「去看看课程」/ 点击跳详情）
- [x] 订单详情页补强：ACTIVE 状态新增「去学习」绿色按钮，跳学习中心
- [x] 个人中心页（最简版）`pages/profile/index/index`（头像首字 / 姓名+手机 / 「我的课程」菜单 / 退出登录）

### 测试卡点

- [x] 订单列表按创建时间倒序，CREATED=橙色/ACTIVE=绿色/其他=灰色
- [x] CREATED 订单详情：「签约授权」按钮 → Toast「签约功能即将上线，敬请期待」
- [x] ACTIVE 订单详情：「去学习」绿色按钮可见，点击跳转学习中心
- [x] 无订单时展示空状态「还没有任何订单」，点击「去看看课程」跳首页
- [x] 个人中心展示登录账号姓名+手机，点「我的课程」跳订单列表
- [x] 退出登录弹确认框，确认后清 token 跳登录页

---

## 模块 7：学习中心（骨架）

### 后端

- [ ] `GET /courses/:courseId/videos`（章节列表，trial 参数过滤）
- [ ] `GET /courses/videos/:videoId/url` → 返回 501（占位）
- [ ] `POST /learning/checkin` → 返回 501（占位）

### 前端

- [ ] 学习中心页：章节列表渲染，点击 Toast「视频功能即将上线」
- [ ] trial=1 时顶部黄色横幅 + 底部报名引导卡片
- [ ] 联系老师区域（微信号 / 联系电话）

### 测试卡点

- [ ] 进入学习页展示章节列表（标题 / 时长占位）
- [ ] 点击任意章节 Toast 提示「视频功能即将上线，敬请期待」
- [ ] trial=1 时只展示第一节，顶部横幅可见，底部有购课入口

---

## 模块 8：个人中心

### 后端

- 无新增接口（复用登录返回的 StudentProfile）

### 前端

- [ ] 个人中心页（头像首字 / 真实姓名 / 手机号 / 实名状态徽标）
- [ ] 未实名时展示「完成实名认证」橙色菜单项，点击跳转实名页
- [ ] 「我的课程」菜单项跳转订单列表页
- [ ] 退出登录（清空本地 token，跳首页 Tab，重新触发静默登录）
- [ ] 未登录态展示「去登录」提示，不展示个人信息

### 测试卡点

- [ ] 已实名用户姓名旁显示「✓ 已实名」，未实名橙色入口可见
- [ ] 退出登录后 token 清除，个人中心切换为未登录态

---

## 模块 9：电子签约（支付宝生物核身确认）

### 后端

- [ ] DB 迁移：新增 SignRecord 表（certifyId + signedAt）
- [ ] `POST /orders/:orderId/sign/initialize`：调用 `alipay.user.certify.open.initialize` → `alipay.user.certify.open.certify`，返回 `{ certifyId, certifyUrl }`
- [ ] `POST /orders/:orderId/sign/confirm`：调用 `alipay.user.certify.open.query`，通过后激活订单 + 生成 Installment

### 前端

- [ ] 订单详情页「签约授权」按钮：调用 initialize，拿到 `certifyUrl`，跳转支付宝认证页
- [ ] 用户完成返回后调用 confirm，刷新订单状态

### 测试卡点

- [ ] 点击「签约授权」跳转至支付宝认证页面
- [ ] 认证通过后订单状态变为 ACTIVE，签约按钮消失，「去学习」出现
- [ ] 认证失败展示错误提示，可再次发起

---

## 模块 10：视频播放（点播对接）

### 后端

- [ ] `GET /courses/videos/:videoId/url`（对接腾讯云 VOD / 阿里云点播，返回签名播放地址，替换 501）

### 前端

- [ ] 学习中心页：点击章节请求播放地址，绑定原生 `<video>` 组件
- [ ] 播放失败错误态 + 重试按钮

### 测试卡点

- [ ] 点击章节后视频正常播放，地址来自后端签名（不可直链访问）
- [ ] 试学模式下仅第一节可播，其他章节提示购课
- [ ] 播放失败时展示错误提示与重试按钮

---

## 模块 11：人脸打卡激励

> 实名认证已在模块 3 用支付宝核身完成，本模块仅需完成打卡激励功能。

### 后端

- [ ] DB 迁移：新增 CheckinRecord 表
- [ ] `POST /learning/checkin/initialize`：调用 `datadigital.fincloud.generalsaas.face.certify.initialize` → `face.certify.verify`，返回 `{ certifyId, certifyUrl }`
- [ ] `POST /learning/checkin/confirm`：调用 `datadigital.fincloud.generalsaas.face.certify.query`，通过后写 CheckinRecord + 激励抵扣记录
- [ ] 打卡激励抵扣 Installment 逻辑

### 前端

- [ ] 学习中心页：展示「开始打卡」按钮（取消占位注释）
- [ ] 调用 initialize，拿到 `certifyUrl`，跳转支付宝人脸核身页
- [ ] 用户完成返回后调用 confirm，展示结果（成功 + 激励金额 / 失败 / 次数超限）

### 测试卡点

- [ ] 点击「开始打卡」跳转至支付宝人脸核身页面
- [ ] 打卡成功展示激励金额，订单详情可见抵扣记录
- [ ] 单期次打卡超限后提示「今日打卡次数已用完」
