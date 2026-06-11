# Nginx 生产配置草案（happymaa.cn）

> 适用环境：腾讯云轻量应用服务器 124.220.78.20，宝塔面板 + Nginx 1.28.3

## 1. 目标入口

| 子域名                 | 用途                        | 部署类型         |
| ---------------------- | --------------------------- | ---------------- |
| admin.happymaa.cn      | web-admin 平台运营后台      | 静态 HTML        |
| insitution.happymaa.cn | web-insitution 机构管理门户 | 静态 HTML        |
| staff.happymaa.cn      | h5-staff 业务员工作台       | 静态 HTML        |
| api.happymaa.cn        | NestJS 后端 API             | Node.js 反向代理 |

说明：static.happymaa.cn 由 COS/CDN 提供，不经本站 Nginx。Adminer 不建议公网长期暴露。

## 2. 上游服务目录约定

```
/www/wwwroot/admin/          # web-admin 静态文件（dist/）
/www/wwwroot/insitution/    # web-insitution 静态文件（dist/）
/www/wwwroot/staff/          # h5-staff 静态文件（dist/）
Node.js 服务：127.0.0.1:3000  # NestJS API
```

> 宝塔面板默认 web 根目录为 `/www/wwwroot/`，与原方案的 `/srv/www/` 统一调整。

## 3. 宝塔面板建站操作步骤

### 3.1 建静态站点（以 insitution 为例，admin/staff 同理）

1. 宝塔面板 -> 网站 -> 添加站点
2. 域名填写：`insitution.happymaa.cn`
3. 根目录：`/www/wwwroot/insitution`
4. PHP 版本：**纯静态**（选"不启用"）
5. 建站完成后，进入站点设置 -> SSL -> 腾讯云证书（或 Let's Encrypt）申请泛域名证书 `*.happymaa.cn`

### 3.2 建 Node.js 站点（API）

1. 宝塔面板 -> 网站 -> 添加站点
2. 域名填写：`api.happymaa.cn`
3. 根目录：`/www/wwwroot/api`（存放启动入口，非静态资源）
4. PHP 版本：**纯静态**（Nginx 只做反代，不需要 PHP）
5. 建站后手动替换该站点的 Nginx 配置（见第 4 节）

### 3.3 SSL 证书申请（宝塔内操作）

推荐申请一张泛域名证书，覆盖所有子域名：

1. 网站 -> 某站点 -> SSL -> 腾讯云 SSL 或 Let's Encrypt
2. 域名填写 `*.happymaa.cn` + `happymaa.cn`
3. 验证方式选 DNS 验证（在 DNSPod 添加 TXT 记录）
4. 签发成功后宝塔会自动写入证书路径并配置续签任务

宝塔证书默认路径（Let's Encrypt）：

```
/www/server/panel/vhost/cert/happymaa.cn/fullchain.pem
/www/server/panel/vhost/cert/happymaa.cn/privkey.pem
```

## 4. Nginx 站点配置

宝塔面板每个站点的配置文件路径：`/www/server/panel/vhost/nginx/<域名>.conf`

可在宝塔面板 -> 网站 -> 设置 -> 配置文件 中直接粘贴覆盖。

### 4.1 全局公共配置（写入 /www/server/nginx/conf/nginx.conf 的 http {} 块内，或独立 include 文件）

```nginx
# JSON 结构化日志格式
log_format main_json escape=json '{'
  '"time":"$time_iso8601",'
  '"remote_addr":"$remote_addr",'
  '"request_id":"$request_id",'
  '"host":"$host",'
  '"request":"$request",'
  '"status":$status,'
  '"body_bytes_sent":$body_bytes_sent,'
  '"request_time":$request_time,'
  '"upstream_time":"$upstream_response_time",'
  '"referer":"$http_referer",'
  '"ua":"$http_user_agent"'
'}';

# WebSocket 升级头（API 若使用 Socket.IO 必需）
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# API 限流：同一 IP 每秒最多 20 个请求，突发允许 40
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# Gzip 压缩（前端 JS/CSS 体积减少 60%+）
gzip on;
gzip_min_length 1k;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript application/json
           application/xml image/svg+xml font/woff2;
gzip_vary on;
```

### 4.2 HTTP -> HTTPS 跳转（所有域名统一）

```nginx
server {
  listen 80;
  server_name admin.happymaa.cn insitution.happymaa.cn staff.happymaa.cn api.happymaa.cn;
  return 301 https://$host$request_uri;
}
```

### 4.3 TLS 公共安全参数（每个 HTTPS server 块内复用）

```nginx
  # TLS 版本与加密套件
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  ssl_stapling on;
  ssl_stapling_verify on;

  # 通用安全响应头
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
```

### 4.4 admin.happymaa.cn

```nginx
server {
  listen 443 ssl http2;
  server_name admin.happymaa.cn;

  ssl_certificate     /www/server/panel/vhost/cert/happymaa.cn/fullchain.pem;
  ssl_certificate_key /www/server/panel/vhost/cert/happymaa.cn/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_stapling on;
  ssl_stapling_verify on;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  root /www/wwwroot/admin;
  index index.html;

  access_log /www/wwwlogs/admin.access.log main_json;
  error_log  /www/wwwlogs/admin.error.log warn;

  # SPA 路由支持
  location / {
    try_files $uri $uri/ /index.html;
  }

  # 静态资源长缓存（构建产物带 hash，可永久缓存）
  location ~* \.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  # HTML 不缓存（保证用户总能拿到最新入口）
  location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
```

### 4.5 insitution.happymaa.cn

```nginx
server {
  listen 443 ssl http2;
  server_name insitution.happymaa.cn;

  ssl_certificate     /www/server/panel/vhost/cert/happymaa.cn/fullchain.pem;
  ssl_certificate_key /www/server/panel/vhost/cert/happymaa.cn/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_stapling on;
  ssl_stapling_verify on;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  root /www/wwwroot/insitution;
  index index.html;

  access_log /www/wwwlogs/insitution.access.log main_json;
  error_log  /www/wwwlogs/insitution.error.log warn;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
```

### 4.6 staff.happymaa.cn

```nginx
server {
  listen 443 ssl http2;
  server_name staff.happymaa.cn;

  ssl_certificate     /www/server/panel/vhost/cert/happymaa.cn/fullchain.pem;
  ssl_certificate_key /www/server/panel/vhost/cert/happymaa.cn/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_stapling on;
  ssl_stapling_verify on;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  root /www/wwwroot/staff;
  index index.html;

  access_log /www/wwwlogs/staff.access.log main_json;
  error_log  /www/wwwlogs/staff.error.log warn;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
```

### 4.7 api.happymaa.cn

```nginx
server {
  listen 443 ssl http2;
  server_name api.happymaa.cn;

  ssl_certificate     /www/server/panel/vhost/cert/happymaa.cn/fullchain.pem;
  ssl_certificate_key /www/server/panel/vhost/cert/happymaa.cn/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_stapling on;
  ssl_stapling_verify on;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;

  access_log /www/wwwlogs/api.access.log main_json;
  error_log  /www/wwwlogs/api.error.log warn;

  # 上传体积限制（文件上传业务按需调整）
  client_max_body_size 20m;

  # API 限流：超出后返回 429
  limit_req zone=api_limit burst=40 nodelay;
  limit_req_status 429;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Request-Id      $request_id;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # WebSocket 支持（Socket.IO / SSE）
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        $connection_upgrade;
    proxy_connect_timeout 5s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
    proxy_pass http://127.0.0.1:3000;
  }

  # 健康检查端点不限流、不记录日志
  location = /health {
    limit_req off;
    proxy_pass http://127.0.0.1:3000;
    access_log off;
  }
}
```

## 5. Node.js 服务部署（PM2）

### 5.1 在服务器上安装 Node.js 与 PM2

```bash
# 宝塔面板 -> 软件商店 -> 搜索 "Node.js" 安装 22.x LTS
# 然后在宝塔终端执行：
npm install -g pm2
```

### 5.2 PM2 ecosystem 配置文件

在服务器 `/www/wwwroot/api/` 目录下创建 `ecosystem.config.js`：

```js
module.exports = {
  apps: [
    {
      name: "happymaa-api",
      script: "dist/main.js",
      instances: 1, // 轻量服务器单核，保持 1 实例
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

### 5.3 启动与管理命令

```bash
# 首次启动
cd /www/wwwroot/api
pm2 start ecosystem.config.js --env production

# 重启
pm2 restart happymaa-api

# 查看日志
pm2 logs happymaa-api

# 开机自启
pm2 save
pm2 startup
```

## 6. 服务器端部署步骤

当前部署策略：所有代码（API + web-admin + web-insitution）集中部署在 `/www/wwwroot/wangke-supermarket`。

### 6.1 登录服务器并进入项目目录

```bash
ssh root@124.220.78.20
cd /www/wwwroot/wangke-supermarket
```

### 6.2 更新代码并构建

```bash
# 更新代码
git pull origin main

# 安装依赖
pnpm install --frozen-lockfile

# 数据库变更（如有 schema 变更）
pnpm --filter api db:push

# 构建三端应用
pnpm --filter api build               # 产出 apps/api/dist/
pnpm --filter web-admin build         # 产出 apps/web-admin/dist/
pnpm --filter web-insitution build    # 产出 apps/web-insitution/dist/
```

### 6.3 同步前端静态资源到 Nginx 目录

```bash
# 覆盖 web-admin（管理后台）
rsync -av --delete apps/web-admin/dist/ /www/wwwroot/admin/

# 覆盖 web-insitution（机构门户）
rsync -av --delete apps/web-insitution/dist/ /www/wwwroot/insitution/
```

### 6.4 重启 API 服务

```bash
# 重启 PM2 中的 API 进程
pm2 restart wangke-api

# 查看日志
pm2 logs wangke-api --lines 50
```

### 6.5 验证部署

```bash
# 检查 Nginx 语法
nginx -t

# 重载 Nginx
systemctl reload nginx

# 检查健康状态（本地测试）
curl http://127.0.0.1:3000/health
```

## 7. 部署验收清单

```
[ ] DNS 四条 A 记录解析生效（dig 验证）
[ ] 泛域名证书签发并写入 Nginx
[ ] nginx -t 语法检查通过
[ ] systemctl reload nginx 或宝塔面板重载成功
[ ] http://admin.happymaa.cn -> 301 跳转 https
[ ] https://admin.happymaa.cn -> 200 正常
[ ] https://insitution.happymaa.cn -> 200 正常
[ ] https://staff.happymaa.cn -> 200 正常
[ ] https://api.happymaa.cn/health -> 200 正常
[ ] curl -I https://admin.happymaa.cn 响应头含 Strict-Transport-Security
[ ] PM2 进程 happymaa-api 状态为 online
[ ] PM2 开机自启已配置（pm2 save + pm2 startup）
```

## 8. 回滚预案

1. 快速回滚代码版本：

   ```bash
   cd /www/wwwroot/wangke-supermarket
   git log --oneline -10        # 查看最近提交
   git reset --hard <commit-id> # 回到指定版本
   pnpm install && pnpm --filter api build
   rsync -av --delete apps/web-admin/dist/ /www/wwwroot/admin/
   rsync -av --delete apps/web-insitution/dist/ /www/wwwroot/insitution/
   pm2 restart wangke-api
   ```

2. API 进程回滚：

   ```bash
   pm2 stop wangke-api
   git reset --hard <previous-commit>
   pnpm --filter api build
   pm2 start wangke-api
   ```

3. Nginx 配置回滚：
   - 宝塔面板保留配置历史版本，或手动备份 `happymaa.conf.bak`。
   - `systemctl reload nginx` 后验证。

4. 证书问题：宝塔 SSL 管理界面恢复旧证书，`systemctl reload nginx`。

## 9. 安全注意事项

1. Adminer 仅内网可达，禁止长期公网暴露。
2. 宝塔面板端口（默认 8888）必须在腾讯云防火墙设置 IP 白名单，不建议全网开放。
3. 服务器 SSH 端口建议修改为非 22 端口，并仅允许密钥登录。
4. API 限流已在 Nginx 层配置，NestJS 应用层同样需要配置 Throttler。
5. 证书私钥不得提交到 Git 仓库。
6. 生产环境 `.env` 文件通过 SSH 手动上传，不经过 Git。

## 10. 变更记录

- 2026-06-09：建立初版草案，覆盖四个入口的基础 Nginx 配置与部署步骤。
- 2026-06-09：完善版 —— 补充宝塔面板操作指引、TLS 安全参数、Gzip 压缩、静态资源缓存、API 限流、健康检查端点、PM2 部署配置、本地构建上传命令、完整验收清单。
- 2026-06-11：部署流程更新 —— 改为服务器内统一仓库部署方案（`/www/wwwroot/wangke-supermarket`），支持 git pull + 本地构建 + 同步部署。所有代码更新仅需服务器内执行 git pull、构建、重启服务。
