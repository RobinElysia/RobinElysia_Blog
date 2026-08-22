---
status: stable
owner: architecture
last-updated: 2026-08-22
related-adr: [0001, 0002, 0006]
---

# 系统全局架构

## 部署形态

本项目是 Next.js 16 全栈应用，目标部署平台为 Vercel（默认），同时保留 Docker 自托管能力。单一运行时（Node.js）承担传统架构中"后端 API + 前端渲染"两层的职责。

```
┌─────────────────────────────────────────────┐
│                   客户端                      │
│  React 19 + React DOM (水合后)              │
│  ┌───────────────────────────────────────┐  │
│  │  Client Components (带交互的 UI)      │  │
│  │  - 事件处理、状态管理、浏览器 API     │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│                ▲ HTTP 请求                    │
│                ▼ HTML/RSC Payload             │
├─────────────────────────────────────────────┤
│                  Next.js 服务器               │
│  ┌───────────────────────────────────────┐  │
│  │  Server Components (RSC)              │  │
│  │  - 直接访问数据库 / 外部 API          │  │
│  │  - 零客户端 JS 体积                   │  │
│  ├───────────────────────────────────────┤  │
│  │  Server Actions                      │  │
│  │  - 表单提交 / 数据变更                │  │
│  │  - 渐进增强（无 JS 也能工作）         │  │
│  ├───────────────────────────────────────┤  │
│  │  Route Handlers (对外端点)             │  │
│  │  - RSS / Sitemap / 图片上传 / 图片服务  │  │
│  │  - 档案图候选（Wellcome 直连，ADR-0006） │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│                ▲ 数据层                      │
│                ▼                             │
│  ┌───────────────────────────────────────┐  │
│  │  PostgreSQL（单一数据源）             │  │
│  │  - posts：文章（Markdown 原文存储）    │  │
│  │  - comments：评论（提交即 approved）   │  │
│  │  - images：文章图片（BYTEA，v0.18.0；v0.22.0 + kind/source_id/档案元数据） │  │
│  │  访问：Drizzle ORM（src/lib/）         │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 模块职责

| 模块 | 职责 | 运行时 |
|------|------|--------|
| Server Components | 数据获取（drizzle 查 PostGre）、渲染 HTML/RSC Payload | Node.js |
| Client Components | 交互、浏览器 API、状态管理 | 浏览器 |
| Server Actions | 数据变更（评论提交、文章 CRUD）、revalidation | Node.js |
| Route Handlers | 对外端点（RSS/Sitemap/图片上传/图片服务/档案图候选 + NextAuth `/api/auth/*`） | Node.js |
| Middleware | **无**——Dashboard 鉴权集中在 `(dashboard)/layout.tsx`（`auth()` + `redirect`），不引入中间件 | — |

## 数据访问

- **唯一数据源**：PostgreSQL（`src/lib/schema.ts` 定义 `posts`/`comments`/`images` 三表）
- **访问方式**：Drizzle ORM，`src/lib/db.ts` 单例连接池（惰性连接，build 时不连库）
- **缓存**：数据库查询不走 fetch Data Cache，用 `unstable_cache`（函数级缓存 + tags，统一 `post-list`），见 `data-layer/caching-and-revalidation.md`
- **评论**：自建，存 PostGre（取代 Giscus），提交走 Server Action + zod 校验 + IP 限流（60s/3 次）；**v0.7.0 起无审核流，提交即 approved 直接显示**。⚠️ 当前无内容审核，仅靠 IP 限流（进程内存实现，多实例部署失效），垃圾评论治理见 `future/roadmap.md`

## 关键边界

- **Server ↔ Client 边界**：通过 `'use client'` 指令标记。Server Component 可以渲染 Client Component，反之不行。Server Component 不能 import 浏览器专用模块。
- **Server Actions ↔ Route Handlers 边界**：内部数据变更走 Server Actions；对外端点（RSS/Sitemap/图片服务/图片上传/档案图候选）走 Route Handlers。本项目无 webhook 端点（`/api/revalidate` 仅为预留概念）。详见 ADR-0002/0006。
- **Static ↔ Dynamic 边界**：Next.js 框架默认静态渲染；**本项目策略为页面级显式 `force-dynamic` 动态渲染**（见 `rendering-strategy.md`）。任何 `cookies()`/`headers()`/`searchParams` 访问或未缓存 `fetch` 也会使页面退化为动态。
