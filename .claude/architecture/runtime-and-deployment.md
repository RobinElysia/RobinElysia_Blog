---
status: stable
owner: architecture
last-updated: 2026-08-22
related-adr: []
---

# 运行时与部署

## Runtime 选择

| Runtime | 适用场景 | 限制 |
|---------|----------|------|
| **Node.js**（默认） | Server Components、Server Actions、Route Handlers | 冷启动较慢（Vercel Serverless） |
| **Edge** | Middleware | 无文件系统、无 Node.js 原生模块 |

**本项目默认全部使用 Node.js Runtime**。Middleware 使用 Edge Runtime（Next.js 强制要求）。

### 为什么不把更多东西放 Edge？

1. **PostgreSQL 驱动需要 Node 原生模块**：文章、评论、图片都存 PostGre（`pg` + Drizzle），底层依赖 TCP socket 等 Node.js 原生能力，Edge Runtime 不支持。
2. **Markdown/MDX 编译管线过重**：正文以 Markdown 存 PostGre，渲染走 `src/lib/mdx-options.ts` 统一管线（next-mdx-remote + rehype-pretty-code + shiki 等），包体积远超 Edge 的 1MB（Vercel）–4MB 限制。

## 部署目标

### 首选：Vercel

```bash
# 部署命令
vercel deploy --prod
```

**优势**：
- Next.js 的原生平台，零配置
- ISR 开箱即用
- Analytics + Speed Insights 集成
- 自动 HTTPS + CDN

### 备选：Docker 自托管

```bash
# 构建 + 启动（详细步骤见项目根 DEPLOY.md）
docker compose up -d --build
```

**何时切到 Docker**：当以下任一条件触发：
1. 需要部署在自有服务器（合规原因）
2. Vercel 的 Serverless 超时（10s/60s）不够用
3. 需要 WebSocket 长连接（Vercel Serverless 不支持）

**Docker 方案要点（v0.19.0 建立，v0.21.1 更新）**：
- 三阶段构建（deps/builder/runner），构建期 `AUTH_SECRET` 用占位符（NextAuth 生产构建要求）
- 容器启动自动跑 `scripts/migrate.mjs`（drizzle-orm migrator，无需 drizzle-kit）
- compose 内置 postgres + pgdata 卷；数据库备份 `pg_dump`
- **Caddy 反向代理内置 compose（v0.21.1）**：80/443 自动 HTTPS（Let's Encrypt 自动签发/续期，证书持久化 caddy_data 卷）、HTTP→HTTPS 308、HSTS；域名由 `PROD_DOMAIN` 注入 Caddyfile，本地测试留空走 localhost 自签（端口可用 `PROD_HTTP_PORT`/`PROD_HTTPS_PORT` 覆盖避开冲突）
- app 不暴露宿主机端口（compose 内网由 Caddy 访问）
- runner 镜像用 `pnpm install --prod`（仅生产依赖，不含 devDeps）——**不用 `output: standalone`**：Next 16 对 pnpm peer-suffix 目录（`drizzle-orm@…_@types+pg…` 等）追踪失效漏包，且 standalone 与 `next start` 互斥（踩坑记录，2026-08-20 实测）
- 图片上传（BYTEA）在 Docker 下同样工作（数据在数据库卷中）

## Next.js 配置

当前 `next.config.ts` 的默认策略：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化：优先输出 AVIF/WebP
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // 未来如有 CMS 图片域名，在此添加
    ],
  },
};

export default nextConfig;
```

> **Server Action 请求体限制**：Next.js 16 中 `serverActions` 配置已移入 `experimental` 命名空间（官方文档仍展示旧写法，以类型定义为准）。默认 1MB 限制对纯文本评论已足够，不配置。如需调大（如图片评论），用 `experimental: { serverActions: { bodySizeLimit: "5mb" } }`。

## 环境变量

| 变量 | 用途 | 必需 | 默认值 |
|------|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串（drizzle 连接池） | **是** | `postgresql://localhost:5432/blog` |
| `SITE_URL` | 站点绝对 URL（RSS/Sitemap 的 link 前缀） | 生产是 | `http://localhost:3000` |
| `AUTH_SECRET` | NextAuth JWT 签名密钥（Dashboard 鉴权） | **生产是**（`openssl rand -base64 32` 生成） | — |
| `AUTH_GITHUB_ID` | GitHub OAuth App 的 Client ID | 否（未配置时不注册 GitHub provider、登录页不显示按钮，v0.19.5/0.19.8） | — |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App 的 Client Secret | 否（同上，与 ID 成对） | — |
| `AUTH_GITHUB_ALLOWED_USERS` | GitHub 登录白名单（逗号分隔用户名/邮箱，大小写不敏感） | 否（**空 = 拒绝所有 GitHub 登录**，安全默认；实现见 `src/lib/auth-allowlist.ts`） | — |
| `ADMIN_USERNAME` | Credentials provider 本地登录用户名（仅 Dashboard） | 否（本地开发用） | `admin` |
| `ADMIN_PASSWORD` | Credentials provider 本地登录密码 | 否（本地开发用） | `change-me` |
| `AUTH_TRUST_HOST` | 本地非默认端口/反向代理的 Host 信任（E2E 3011 等；生产 Vercel 自动信任） | 否 | `true` |
| `REVALIDATION_SECRET` | Webhook revalidation 共享密钥（**预留**，`/api/revalidate` 未实现） | 否 | — |

环境变量在 `.env.local`（开发，模板见 `.env.example`）和 Vercel Dashboard（生产）中设置。`.env.local` 不提交到 Git。Docker 部署用 `PROD_*` 前缀插值（见根目录 `DEPLOY.md` 与 `docker-compose.yml`，v0.19.9 起为避免 shell 环境残留覆盖 .env 值）。

## 本地数据库

PostGre 本地运行方式（二选一）：

```bash
# 方案 A：Docker
docker run -d --name blog-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17

# 方案 B：Neon 云实例（免费档）→ 复制连接串到 .env.local
# psql 连接后执行迁移：
pnpm drizzle-kit migrate
```
