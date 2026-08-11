---
status: stable
owner: architecture
last-updated: 2025-07-11
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

1. **MDX 编译需要文件系统**：博客文章以 MDX 文件存储在 `src/content/`，读取和编译这些文件需要 `fs` 模块。Edge Runtime 不支持 `fs`。
2. **数据库驱动需要 Node 模块**：未来如果用 PostgreSQL（`pg` 或 Drizzle），这些底层驱动依赖 Node.js 原生模块（TCP socket）。
3. **Edge 的包体积限制**：Edge Runtime 有 1MB（Vercel）到 4MB 的包体积限制，而 `next-mdx-remote` 等 Markdown 处理库通常远超这个限制。

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

**Docker 方案要点（v0.19.0）**：
- 三阶段构建（deps/builder/runner），构建期 `AUTH_SECRET` 用占位符（NextAuth 生产构建要求）
- 容器启动自动跑 `scripts/migrate.mjs`（drizzle-orm migrator，无需 drizzle-kit）
- compose 内置 postgres + pgdata 卷；数据库备份 `pg_dump`
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
| `AUTH_SECRET` | NextAuth 密钥（Dashboard） | 否（暂无鉴权） | — |
| `AUTH_GITHUB_ID` | NextAuth GitHub Provider | 否 | — |
| `AUTH_GITHUB_SECRET` | NextAuth GitHub Provider | 否 | — |
| `REVALIDATION_SECRET` | Webhook revalidation 共享密钥 | 否 | — |

环境变量在 `.env.local`（开发，模板见 `.env.example`）和 Vercel Dashboard（生产）中设置。`.env.local` 不提交到 Git。

## 本地数据库

PostGre 本地运行方式（二选一）：

```bash
# 方案 A：Docker
docker run -d --name blog-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17

# 方案 B：Neon 云实例（免费档）→ 复制连接串到 .env.local
# psql 连接后执行迁移：
pnpm drizzle-kit migrate
```
