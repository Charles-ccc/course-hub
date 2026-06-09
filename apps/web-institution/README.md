# web-institution

机构管理门户前端工程，技术栈为 React + TypeScript + Ant Design + React Query。

## 本地启动

在仓库根目录执行：

```bash
pnpm install
pnpm dev:web-institution
```

或仅启动本应用：

```bash
pnpm --filter web-institution dev
```

## 常用命令

```bash
pnpm --filter web-institution build
pnpm --filter web-institution lint
```

## 环境变量

可在 apps/web-institution 下创建 .env.local：

```bash
VITE_API_BASE_URL=https://api.happymaa.cn/api/v1
VITE_USE_MOCK=false
```

说明：

1. 默认配置面向联调/生产，`VITE_USE_MOCK=false`。
2. 仅在本地开发且需要脱离后端时，才显式改为 `VITE_USE_MOCK=true`。
3. 生产构建即使误传未设置值，也不会默认启用 mock。

## 已实现页面

1. 登录
2. 运营概览
3. 课程管理
4. 订单管理
5. 逾期管理
6. 结算对账
7. 答疑管理

## 关键行为

1. 未登录访问业务页自动跳转 /login。
2. 接口 401 自动清理 token 并跳转 /login（dev- token 例外）。
3. 金额字段统一使用分传输，页面展示自动转元。
