# DNS 与证书执行清单（腾讯云）

## 1. 目标域名

1. admin.happymaa.cn -> 管理后台
2. insitution.happymaa.cn -> 机构门户
3. staff.happymaa.cn -> 业务员 H5
4. api.happymaa.cn -> 后端 API
5. static.happymaa.cn -> COS 静态资源（已存在）

## 2. DNS 解析步骤（腾讯云 DNSPod）

1. 登录腾讯云控制台 -> DNSPod。
2. 选择主域名 happymaa.cn。
3. 新增 A 记录：

- 主机记录：admin，记录值：124.220.78.20，TTL：600
- 主机记录：institution，记录值：124.220.78.20，TTL：600
- 主机记录：staff，记录值：124.220.78.20，TTL：600
- 主机记录：api，记录值：124.220.78.20，TTL：600

4. 如需数据库应急访问，新增 dba 记录并设置访问控制策略（默认不建议创建）。
5. 执行解析生效检查：

- dig +short admin.happymaa.cn
- dig +short insitution.happymaa.cn
- dig +short staff.happymaa.cn
- dig +short api.happymaa.cn

验收标准：四个子域名均解析到 124.220.78.20。

## 3. 证书申请步骤（腾讯云 SSL 证书）

推荐：申请一个泛域名证书 \*.happymaa.cn（覆盖 admin/institution/staff/api）。

1. 腾讯云 SSL 证书服务 -> 申请免费或付费证书。
2. 证书域名填写 \*.happymaa.cn（或分别申请单域名证书）。
3. 验证方式选择 DNS 验证。
4. 按提示在 DNSPod 增加验证 TXT/CNAME 记录。
5. 等待 CA 签发成功后下载 Nginx 证书包。

验收标准：

1. 证书颁发成功。
2. 证书覆盖目标子域名。
3. 有效期与续签提醒已配置。

## 4. 服务器落地步骤

1. 创建目录：/etc/nginx/ssl。
2. 上传证书与私钥：

- happymaa.fullchain.pem
- happymaa.key.pem

3. 设置权限：

- chmod 600 /etc/nginx/ssl/happymaa.key.pem
- chown root:root /etc/nginx/ssl/happymaa.key.pem

4. 引用证书到 Nginx 站点配置。
5. 执行 nginx -t 与 systemctl reload nginx。

## 5. HTTPS 验证

1. 浏览器访问：

- https://admin.happymaa.cn
- https://insitution.happymaa.cn
- https://staff.happymaa.cn
- https://api.happymaa.cn/health

2. 命令检查：

- curl -I http://admin.happymaa.cn（应 301 到 https）
- curl -I https://admin.happymaa.cn（应 200）

3. 证书检查：

- openssl s_client -connect admin.happymaa.cn:443 -servername admin.happymaa.cn

## 6. 安全与运维要求

1. 不在仓库提交证书私钥。
2. 配置证书到期告警（提前 30 天、7 天）。
3. 管理端与机构端必须强制 HTTPS。
4. Adminer 默认内网访问，如临时公网开放必须设置白名单并设置到期时间。

## 7. 回滚与应急

1. DNS 变更前导出记录快照。
2. Nginx 变更前备份配置文件。
3. 若证书失败：暂回旧证书 + 保持原入口可用。
4. 若域名解析异常：临时切回 IP:端口仅用于内部应急，不作为长期方案。

## 8. 执行记录模板

- 变更时间：
- 变更人：
- 变更内容：
- 验收人：
- 验收结果：
- 回滚点：
