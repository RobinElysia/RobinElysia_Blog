# 部署指南（Docker 生产部署）

> 适用：自有服务器（VPS/云主机）部署 ReZenKi 博客。镜像已包含 Next.js 应用与自动数据库迁移。

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
```

## 三、部署文件

在 `/opt/rezenki/` 下创建两个文件：

### 1. `docker-compose.yml`（与项目根目录一致）

```yaml
services:
  app:
    image: <your-registry>/rezenki-blog:latest   # ← 换成你的镜像地址
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"   # 只绑定本机，由 Nginx 反代（见第五节）
    environment:
      SITE_URL: ${PROD_SITE_URL:?请在 .env 设置}
      AUTH_SECRET: ${PROD_AUTH_SECRET:?请在 .env 设置}
      AUTH_TRUST_HOST: "true"
      ADMIN_USERNAME: ${PROD_ADMIN_USERNAME:-admin}
      ADMIN_PASSWORD: ${PROD_ADMIN_PASSWORD:?请在 .env 设置}
      DATABASE_URL: ${PROD_DATABASE_URL:?请在 .env 设置}
      AUTH_GITHUB_ID: ${PROD_AUTH_GITHUB_ID:-}
      AUTH_GITHUB_SECRET: ${PROD_AUTH_GITHUB_SECRET:-}
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
      POSTGRES_PASSWORD: ${PROD_POSTGRES_PASSWORD:?请在 .env 设置}
      POSTGRES_DB: ${PROD_POSTGRES_DB:-blog}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  pgdata:
```

### 2. `.env`（生产环境变量，务必填写真实值）

> **注意**：变量名带 `PROD_` 前缀——compose 插值优先读 shell 环境变量，
> 终端会话可能残留旧值（如 `ADMIN_PASSWORD`），`PROD_` 前缀保证值始终来自本文件。

```bash
# 站点绝对 URL（RSS/Sitemap 链接前缀，填你的域名）
PROD_SITE_URL=https://blog.example.com

# NextAuth 密钥（必填，生成方式：openssl rand -base64 32）
PROD_AUTH_SECRET=替换为openssl生成的随机串

# 后台登录（Credentials provider）
PROD_ADMIN_USERNAME=admin
PROD_ADMIN_PASSWORD=替换为强密码

# 数据库（compose 内置 postgres，首次初始化时生效）
PROD_POSTGRES_USER=postgres
PROD_POSTGRES_PASSWORD=替换为强密码
PROD_POSTGRES_DB=blog
PROD_DATABASE_URL=postgresql://postgres:替换为强密码@db:5432/blog

# GitHub OAuth（可选，用于 GitHub 登录）
PROD_AUTH_GITHUB_ID=
PROD_AUTH_GITHUB_SECRET=
```

## 四、启动

```bash
cd /opt/rezenki

# 拉取镜像并启动（首次启动会自动执行数据库迁移）
docker compose up -d

# 查看状态
docker compose ps            # 两个容器应为 Up (healthy)
docker compose logs -f app   # 应用日志（应看到 "✓ 数据库迁移完成" + "Ready")

# 验证
curl http://localhost:3000/        # 200
curl http://localhost:3000/login   # 200
```

> **首次启动**：`app` 容器会先执行 `node scripts/migrate.mjs` 建表，再启动 Next.js。
> 数据库数据持久化在 `pgdata` 卷中，`docker compose down` 不丢数据，`down -v` 才会清空。

## 五、反向代理 + HTTPS（Nginx 示例）

```bash
# 安装 Nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx
```

创建 `/etc/nginx/sites-available/rezenki`：

```nginx
server {
    listen 80;
    server_name blog.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rezenki /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 自动 HTTPS 证书
sudo certbot --nginx -d blog.example.com
```

> Caddy 更简单：`blog.example.com { reverse_proxy 127.0.0.1:3000 }` 自动签发证书。

## 六、日常运维

```bash
# 查看日志
docker compose logs -f app

# 部署新版本（开发机重新构建推送后，服务器上）
docker compose pull && docker compose up -d

# 重启
docker compose restart app

# 备份数据库（重要！）
docker compose exec db pg_dump -U postgres blog > backup-$(date +%F).sql
# 恢复：cat backup.sql | docker compose exec -T db psql -U postgres blog

# 进入后台
# 浏览器打开 https://你的域名/login 用 ADMIN_USERNAME/ADMIN_PASSWORD 登录
```

## 七、故障排查

| 症状 | 排查 |
|------|------|
| app 反复重启 | `docker compose logs app`——多半是迁移失败或环境变量缺失（AUTH_SECRET 必填） |
| 首页 500 数据库错误 | `docker compose logs db` 检查数据库健康；确认 DATABASE_URL 未手动覆盖 |
| 登录 500 | AUTH_SECRET 未设置或与构建时不一致（构建占位符仅构建期使用，运行期必须真实值） |
| 图片上传 401 | 未登录；登录后重试 |
| RSS 链接是 localhost | SITE_URL 未配置或未生效（改 .env 后 `docker compose up -d` 重建容器） |
