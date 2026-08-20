# 部署指南（Docker 生产部署）

> 适用：自有服务器（VPS/云主机）部署 ReZenKi 博客。镜像已包含 Next.js 应用与自动数据库迁移；**Caddy 反向代理内置在 compose 中，自动 HTTPS（Let's Encrypt）**。

## 一、本地构建镜像并推送到镜像仓库

在**开发机**（本机）执行：

```bash
# 1. 构建镜像（多阶段：依赖 → 构建 → 运行）
docker build -t <your-registry>/rezenki-blog:latest .

# 2. 推送到镜像仓库（任选其一）
# Docker Hub：
docker push <your-registry>/rezenki-blog:latest

# GitHub Container Registry：
docker tag <your-registry>/rezenki-blog:latest ghcr.io/<你的用户名>/rezenki-blog:latest
docker push ghcr.io/<你的用户名>/rezenki-blog:latest

# 阿里云 ACR / 腾讯云 TCR 同理：先登录再 push
```

> 没有镜像仓库也可以在服务器上直接构建（把项目代码传到服务器后 `docker build`），
> 但推送到仓库后服务器拉取更快、不依赖源码。

## 二、服务器准备

```bash
# 1. 安装 Docker + Compose 插件（Ubuntu/Debian 示例）
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# 2. 验证
docker --version && docker compose version

# 3. 创建部署目录
mkdir -p /opt/rezenki && cd /opt/rezenki

# 4. 防火墙开放 80/443（HTTPS 必需；80 用于签发证书与 HTTP→HTTPS 重定向）
# ufw 示例：sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
# 云厂商控制台：放行安全组的 80/443 入站规则
```

## 三、部署文件

在 `/opt/rezenki/` 下放置三个文件（与仓库根目录一致：`docker-compose.yml`、`Caddyfile`、`.env`）：

### 1. `docker-compose.yml`（与仓库一致，app 改用镜像地址）

```yaml
services:
  app:
    image: <your-registry>/rezenki-blog:latest   # ← 换成你的镜像地址
    restart: unless-stopped
    environment:
      SITE_URL: ${PROD_SITE_URL:?请在 .env 设置 PROD_SITE_URL}
      AUTH_SECRET: ${PROD_AUTH_SECRET:?请在 .env 设置 PROD_AUTH_SECRET}
      AUTH_TRUST_HOST: "true"
      ADMIN_USERNAME: ${PROD_ADMIN_USERNAME:-admin}
      ADMIN_PASSWORD: ${PROD_ADMIN_PASSWORD:?请在 .env 设置 PROD_ADMIN_PASSWORD}
      DATABASE_URL: ${PROD_DATABASE_URL:?请在 .env 设置 PROD_DATABASE_URL}
      AUTH_GITHUB_ID: ${PROD_AUTH_GITHUB_ID:-}
      AUTH_GITHUB_SECRET: ${PROD_AUTH_GITHUB_SECRET:-}
      AUTH_GITHUB_ALLOWED_USERS: ${PROD_AUTH_GITHUB_ALLOWED_USERS:-}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${PROD_POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${PROD_POSTGRES_PASSWORD:?请在 .env 设置 PROD_POSTGRES_PASSWORD}
      POSTGRES_DB: ${PROD_POSTGRES_DB:-blog}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${PROD_DOMAIN:?请在 .env 设置 PROD_DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

### 2. `Caddyfile`（与仓库一致）

```caddyfile
{$DOMAIN:localhost} {
	encode zstd gzip
	reverse_proxy app:3000
	header {
		-Server
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
	}
}
```

### 3. `.env`（生产环境变量，务必填写真实值）

> **注意**：变量名带 `PROD_` 前缀——compose 插值优先读 shell 环境变量，终端会话可能残留旧值
> （如 `ADMIN_PASSWORD`），`PROD_` 前缀保证值始终来自本文件。

```bash
# 站点绝对 URL（RSS/Sitemap 链接前缀）
PROD_SITE_URL=https://blog.example.com

# 域名（Caddy 自动 HTTPS 的证书域名；DNS 必须先指向服务器 IP）
PROD_DOMAIN=blog.example.com

# NextAuth 密钥（openssl rand -base64 32 生成）
PROD_AUTH_SECRET=替换为openssl生成的随机串

# 后台登录（Credentials provider）
PROD_ADMIN_USERNAME=admin
PROD_ADMIN_PASSWORD=替换为强密码

# 数据库（compose 内置 postgres；主机名必须是 db）
PROD_POSTGRES_USER=postgres
PROD_POSTGRES_PASSWORD=替换为强密码
PROD_POSTGRES_DB=blog
PROD_DATABASE_URL=postgresql://postgres:替换为强密码@db:5432/blog

# GitHub OAuth（可选）
PROD_AUTH_GITHUB_ID=
PROD_AUTH_GITHUB_SECRET=
PROD_AUTH_GITHUB_ALLOWED_USERS=
```

> ⚠️ `PROD_DATABASE_URL` 里的密码必须与 `PROD_POSTGRES_PASSWORD` 一致。

## 四、启动

```bash
cd /opt/rezenki
docker compose up -d
docker compose ps            # 三个容器应为 Up (healthy)
docker compose logs -f app   # 应看到 "✓ 数据库迁移完成" + "Ready"
```

> **首次启动**：app 容器先执行 `node scripts/migrate.mjs` 建表，再启动 Next.js。
> 数据持久化在 `pgdata` 卷中，`docker compose down` 不丢数据，`down -v` 才清空。
> Caddy 首次启动自动向 Let's Encrypt 申请证书（需 DNS 已生效 + 80/443 可达），
> 证书持久化在 `caddy_data` 卷中，自动续期。

## 五、HTTPS（Caddy 自动完成，无需任何额外操作）

- **证书**：Caddy 对 `PROD_DOMAIN` 自动申请 Let's Encrypt 证书并自动续期（默认 ACME HTTP-01 验证）
- **重定向**：HTTP（80）自动 308 跳转 HTTPS（443）
- **HSTS**：响应头自动附加 `Strict-Transport-Security`
- **排障**：`docker compose logs caddy`；证书签发失败多为 DNS 未生效或 80 端口被占用

### 本地测试（无域名）

```bash
# 默认 DOMAIN=localhost：Caddy 用本地 CA 自签证书，浏览器会提示不受信任（接受即可）
PROD_HTTP_PORT=3080 PROD_HTTPS_PORT=3443 docker compose up -d --build
curl -k https://localhost:3443/   # 200 = HTTPS 链路通
```

> 端口覆盖（`PROD_HTTP_PORT`/`PROD_HTTPS_PORT`）用于避开本机 80/443 冲突；生产留空用默认。

## 六、日常运维

```bash
docker compose logs -f app          # 应用日志
docker compose pull && docker compose up -d   # 部署新版本（镜像更新后）
docker compose restart app          # 重启应用

# 备份数据库（重要！）
docker compose exec db pg_dump -U postgres blog > backup-$(date +%F).sql
# 恢复：cat backup.sql | docker compose exec -T db psql -U postgres blog

# 进入后台：浏览器打开 https://你的域名/login，用 ADMIN_USERNAME/ADMIN_PASSWORD 登录
```

## 七、故障排查

| 症状 | 排查 |
|------|------|
| app 反复重启 | `docker compose logs app`——多为迁移失败或环境变量缺失（AUTH_SECRET 必填） |
| app 报 `password authentication failed` | **旧 pgdata 卷的密码与新 .env 不一致**——改过 `PROD_POSTGRES_PASSWORD` 后旧卷不会更新密码；首次部署或确认可丢数据时 `docker compose down -v` 重建，否则进 db 容器 `ALTER USER` 同步密码 |
| 首页 500 / 文章不显示 | `docker compose logs app` 查库错误；确认 `DATABASE_URL` 未被手动覆盖；**首页数据有 5 分钟缓存**（unstable_cache revalidate 300）——刚导入数据后可能显示旧列表，属正常 |
| 证书签发失败 | `docker compose logs caddy`；确认 DNS 指向本机 + 80 端口可从公网访问 |
| 登录 500 | AUTH_SECRET 未设置或与构建时不一致（构建占位符仅构建期使用，运行期必须真实值） |
| 图片上传 401 | 未登录；登录后重试 |
| RSS 链接是 localhost | SITE_URL 未配置或未生效（改 .env 后 `docker compose up -d` 重建容器） |
