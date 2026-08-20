---
status: stable
owner: architecture
last-updated: 2026-08-20
related-adr: [0001]
---

# App Router 路由地图

## 路由树结构（对齐 src/app/ 实际文件，2026-08-20 核对）

```
src/app/
├── layout.tsx               # 根布局：<html>/<body>、字体变量（Inter+Italianno）、SSR 主题 class（cookie 读取）、metadata、SiteHeader + footer
├── page.tsx                 # 首页 "/"（force-dynamic）：场景化首页——3D 波浪 Hero + 逐卡翻页（getRecentPosts(8) → HomeScenes）
├── error.tsx                # 全局错误边界
├── not-found.tsx            # 全局 404
├── favicon.ico / globals.css（Design Token + 黑白双模式）
├── robots.ts                # /robots.txt（禁爬 /dashboard /login /api/）
├── sitemap.ts               # /sitemap.xml（Next.js 内置约定，force-dynamic）
│
├── (marketing)/             # Route Group：无需鉴权的公开页面（无独立 layout——共用根 layout + SiteHeader）
│   ├── about/page.tsx       # /about（品牌故事）
│   ├── archive/page.tsx     # /archive（按 年→月 分组的归档）
│   └── blog/
│       ├── page.tsx         # /blog（文章列表：?tag= 筛选 + ?page= 分页，每页 10 篇，force-dynamic）
│       ├── [slug]/page.tsx  # /blog/:slug（详情：MDX 正文 + TOC + 前后篇 + 相关文章 + 评论 + JSON-LD，decodeSlug 处理中文 slug）
│       └── [slug]/not-found.tsx  # 文章级 404
│
├── login/page.tsx           # /login（server wrapper：按 AUTH_GITHUB_ID/SECRET 判断是否显示 GitHub 按钮 + client LoginForm）
│
├── (dashboard)/             # Route Group：需鉴权的后台
│   ├── layout.tsx           # 集中鉴权：auth() 无 session → redirect("/login")；侧边导航（概览/文章管理/退出）
│   ├── dashboard/page.tsx   # /dashboard（概览：文章/已发布/评论统计 + 最近文章）
│   └── dashboard/posts/
│       ├── page.tsx         # /dashboard/posts（文章管理列表：状态/评论数/编辑/删除）
│       ├── new/page.tsx     # /dashboard/posts/new（新建文章）
│       └── [id]/edit/page.tsx  # /dashboard/posts/:id/edit（编辑文章）
│
├── api/auth/[...nextauth]/route.ts  # NextAuth v5 handlers
├── api/upload-image/route.ts        # POST：文章图片上传（admin 鉴权 + jpeg/png/webp/gif + ≤5MB → images 表 BYTEA）
├── api/images/[id]/route.ts         # GET：图片服务（公开，Cache-Control immutable 永久缓存）
│
└── feed.xml/route.ts       # RSS Feed（GET，XML Content-Type）
```

**不存在的路由/文件**（勿凭旧文档添加）：
- `middleware.ts` —— 全项目无 middleware，鉴权在 `(dashboard)/layout.tsx`
- `settings` 路由 —— 已移除
- `loading.tsx`（全局与路由级都没有）—— 与"loading.tsx 破坏 404 状态码"规则一致（见 data-layer/streaming-and-suspense.md）
- `app/_lib/` —— 共享逻辑统一在 `src/lib/`

## 路由分组意图

### `(marketing)`
- **用途**：所有无需登录即可访问的页面。
- **为什么分组**：与 `(dashboard)` 共享同一 URL 空间（不影响 URL 路径），且两组页面形态不同。当前没有独立的 `(marketing)/layout.tsx`——公开页共用根 layout（SiteHeader + footer）；若未来公开页需要专属布局（如页脚差异），在组内新增 layout 即可，无需改动根布局。

### `(dashboard)`
- **用途**：需要鉴权的后台页面。
- **为什么分组**：隔离鉴权逻辑——`(dashboard)/layout.tsx` 中集中做登录检查（`auth()`），未登录 `redirect("/login")`，比在每个页面里散落 `if (!user) redirect(...)` 更可靠。
- **当前内容**：概览 + 文章管理 CRUD（新建/编辑/删除）。**无评论审核页**——v0.7.0 起评论无审核流，提交即显示（`comments` 表的 status 列保留兼容历史数据）。

## 私有文件夹约定

- `_folder/` 语法：App Router 的私有文件夹约定（`_components/` 等）。本项目共享逻辑统一放在 **`src/lib/`**（src 目录布局下），`app/` 内不再设 `_lib/`。
- `_components/`：页面级私有组件。如果一个组件只被某个路由使用，放在该路由的 `_components/` 目录下；如果被多个路由共享，提升到 `src/components/`。

## 鉴权边界（用户决策）

- **C 端（公开页面：首页、/blog、文章详情、/about、/archive）不需要鉴权**——全部走 `(marketing)/`；根级 `/login` 同样无需鉴权（它是登录入口本身）。
- **Dashboard 需要鉴权**（NextAuth v5：GitHub OAuth + Credentials 双 provider，GitHub 登录受 `AUTH_GITHUB_ALLOWED_USERS` 白名单限制）——`(dashboard)/layout.tsx` 集中做登录检查，未登录 `redirect("/login")`。
- **无 middleware.ts**：本项目不引入全局鉴权中间件——C 端页面不能被拖进鉴权流程，Dashboard 鉴权由 layout 层完成（早期文档"Middleware 重定向"的描述已过时，以本文档为准）。

## 当前 Parallel/Intercepting Routes

暂无。如果需要模态路由（如 `/photos/[id]` 在 `/photos` 页面上以模态框打开），使用 `@modal` 并行路由 + `(.)photo/[id]` 拦截路由。
