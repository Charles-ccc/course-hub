# mp-student 开发进度

> 按模块顺序推进，每个模块完成后由产品回归测试，确认通过后打勾继续下一模块。

---

## 模块 1：工程骨架 & 网络层

### 后端
- [ ] DB 全量迁移（OrgCode / Student / RefreshToken / RealnameRecord / CourseVideo / Course / Order 表变更）
- [ ] AppRole 新增 STUDENT，TokenService 扩展 refreshOwner 映射
- [ ] StudentAuthController 骨架注册（路由占位）
- [ ] `POST /auth/sms/send` 可用，dev 环境验证码写入日志（不发真实短信）

### 前端
- [ ] 初始化 `apps/mp-student` 工程（app.js / app.json / app.acss / mini.project.json）
- [ ] `mini.project.json` 填入 AppID `2021006157643188`
- [ ] `app.json` 配置 12 个页面路由与 3 Tab TabBar
- [ ] `services/request.js` 封装（baseURL / Authorization 头 / 统一错误解析 / 401 刷新重试）
- [ ] `app.js` onLaunch：归因参数捕获 + 静默登录框架
- [ ] 所有页面创建空白骨架文件，IDE 路由无报错

### 测试卡点
- [ ] 支付宝 IDE 可正常打开，TabBar 三个 Tab 切换无报错
- [ ] 前端调 `POST /auth/sms/send` 返回 200，后端日志可见验证码

---

## 模块 2：注册 & 登录

### 后端
- [ ] `POST /auth/alipay/login`（authCode 换 openId，已注册返回 token，未注册返回 needRegister）
- [ ] `POST /auth/alipay/register`（authCode + encryptedData + iv 解密手机号 + orgCode 注册）
- [ ] `POST /auth/org-code/validate`（机构码校验，含冻结逻辑；按 openId 计冻结次数）
- [ ] `POST /auth/refresh`（Token 刷新）

### 前端
- [ ] `app.js` onLaunch：调用 `my.login()` → `POST /auth/alipay/login`，已注册跳首页，未注册跳引导页
- [ ] 引导页（仅「立即注册」一个入口）
- [ ] 注册页：机构码输入 + 校验卡片 + 「授权手机号并注册」按钮（支付宝原生授权组件）
- [ ] 机构码校验卡片组件（展示机构名 + 业务员名）

### 测试卡点
- [ ] 已注册用户打开小程序，无任何弹框直接进入首页（静默登录）
- [ ] 未注册用户打开小程序，展示注册引导页
- [ ] 输入无效机构码展示正确错误提示，同一账号失败 5 次后冻结 30 分钟
- [ ] 点击「授权手机号」→ 支付宝弹出授权确认 → 注册成功跳实名认证页
- [ ] 拒绝授权时提示需要授权才能注册，按钮保持可点击
- [ ] Access token 过期后自动刷新，请求无感重试

---

## 模块 3：实名认证

### 后端
- [ ] `POST /users/realname/initialize`（调用支付宝 face.verification.initialize，返回 certifyId）
- [ ] `POST /users/realname/verify`（调用支付宝 face.verification.query 查询结果，写入 RealnameRecord）
- [ ] 年龄判断：核身结果含身份证信息，后端解析判定是否未成年并拦截

### 前端
- [ ] 实名认证页：展示说明文案 + 「开始认证」按钮
- [ ] 点击后请求 initialize 获得 certifyId，调用 `my.startFaceVerify({ certifyId })`
- [ ] 核身完成回调 → 调用 verify 接口确认结果
- [ ] 三种状态处理：通过（跳首页）/ 未通过（重新认证按钮）/ 用户取消（恢复按钮）

### 测试卡点
- [ ] 点击「开始认证」唤起支付宝人脸核身流程
- [ ] 核身通过后跳转首页，个人中心展示「✓ 已实名」
- [ ] 未成年人核身通过但年龄不满 18 岁，展示拦截提示
- [ ] 核身失败展示提示，「重新认证」按钮可用
- [ ] 已认证用户再次进入实名页展示已认证状态，不可重复提交

---

## 模块 4：课程发现

### 后端
- [ ] `GET /courses`（关键词搜索 + 分页）
- [ ] `GET /courses/:courseId`（课程详情）

### 前端
- [ ] 课程列表页（搜索框 + 分页加载 + 空状态）
- [ ] 课程卡片组件（名称 / 机构 / 每期价格 / 先学后付徽标）
- [ ] 课程详情页（大纲 / 分期方案 / 合规声明 / 报名按钮 / 购课须知弹框）

### 测试卡点
- [ ] 未登录时可浏览列表，点击课程卡片跳转登录页
- [ ] 登录后可进入课程详情，首次点击「立即报名」弹购课须知
- [ ] 关键词搜索结果正确，无结果时展示空状态

---

## 模块 5：下单流程

### 后端
- [ ] `POST /orders`（RealnameGuard 拦截 + UNDERAGE / PRICE_LIMIT 错误处理）
- [ ] `POST /orders/:orderId/sign/fadadada` → 返回 501（占位）

### 前端
- [ ] 下单确认页（课程名 / 付款方式说明 / 确认按钮）

### 测试卡点
- [ ] 未实名用户点击下单，提示「请先完成实名认证」
- [ ] 先学后付 / 立即付款两种 payType 均可创建订单
- [ ] 创建成功后跳转订单详情页，订单状态为 CREATED

---

## 模块 6：订单管理

### 后端
- [ ] `GET /orders`（订单列表）
- [ ] `GET /orders/:orderId`（订单详情，含 installments 数组）

### 前端
- [ ] 订单列表页（状态标签配色 / 空状态 / 跳转详情）
- [ ] 订单详情页（课程信息 / 状态操作区 / 签约占位按钮）
- [ ] 分期明细组件（期次 / 到期日 / 金额 / 状态标签）

### 测试卡点
- [ ] 订单列表按创建时间倒序，各状态标签颜色正确
- [ ] CREATED 状态下点击「签约授权」显示「签约功能即将上线」Toast
- [ ] ACTIVE 状态下展示「去学习」按钮，分期明细可见
- [ ] 无订单时展示空状态与「去看看课程」跳转

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
- [ ] 退出登录（清空 token + registeredPhone，跳首页 Tab）
- [ ] 未登录态展示「去登录」提示，不展示个人信息

### 测试卡点
- [ ] 已实名用户姓名旁显示「✓ 已实名」，未实名橙色入口可见
- [ ] 退出登录后 token 清除，个人中心切换为未登录态

---

## 模块 9：电子签约（支付宝生物核身确认）

### 后端
- [ ] DB 迁移：新增 SignRecord 表（记录 certifyId + 签约时间戳，作为本人操作凭证）
- [ ] `POST /orders/:orderId/sign/initialize`（调用 face.verification.initialize，返回 certifyId）
- [ ] `POST /orders/:orderId/sign/confirm`（调用 face.verification.query 查询核身结果，通过后激活订单 + 生成 Installment）

### 前端
- [ ] 订单详情页「签约授权」按钮：调用 initialize 获得 certifyId，调用 `my.startFaceVerify()`
- [ ] 核身完成后调用 confirm，成功后刷新订单状态

### 测试卡点
- [ ] 点击「签约授权」唤起支付宝人脸核身流程
- [ ] 核身通过后订单状态变为 ACTIVE，签约按钮消失，「去学习」出现
- [ ] 核身失败展示错误提示，可再次发起

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
- [ ] `POST /learning/checkin/initialize`（调用 face.verification.initialize，返回 certifyId）
- [ ] `POST /learning/checkin/confirm`（查询核身结果，通过后写 CheckinRecord + 激励记录，替换 501）
- [ ] 打卡激励抵扣 Installment 逻辑

### 前端
- [ ] 学习中心页：展示「开始打卡」按钮（取消占位注释）
- [ ] 调用 initialize → `my.startFaceVerify()` → confirm
- [ ] 打卡结果展示（成功 + 激励金额 / 失败 / 次数超限）

### 测试卡点
- [ ] 点击「开始打卡」唤起支付宝人脸核身
- [ ] 打卡成功展示激励金额，订单详情可见抵扣记录
- [ ] 单期次打卡超限后提示「今日打卡次数已用完」
