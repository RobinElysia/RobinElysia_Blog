---
status: stable
owner: architecture
last-updated: 2025-07-11
related-adr: [0001, 0002]
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
│  │  Route Handlers (仅外部消费)          │  │
│  │  - Webhook 接收 / 移动端 API          │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│                ▲ 数据层                      │
│                ▼                             │
│  ┌───────────────────────────────────────┐  │
│  │  PostgreSQL（单一数据源）             │  │
│  │  - posts：文章（Markdown 原文存储）    │  │
│  │  - comments：评论（审核流）            │  │
│  │  访问：Drizzle ORM（src/lib/）         │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 模块职责

| 模块 | 职责 | 运行时 |
|------|------|--------|
| Server Components | 数据获取（drizzle 查 PostGre）、渲染 HTML/RSC Payload | Node.js |
| Client Components | 交互、浏览器 API、状态管理 | 浏览器 |
| Server Actions | 数据变更（评论提交）、revalidation | Node.js |
| Route Handlers | 对外 API（RSS/Sitemap） | Node.js |
| Middleware | 重定向（Dashboard 鉴权前移至 layout） | Edge（默认） |

## 数据访问

- **唯一数据源**：PostgreSQL（`src/lib/schema.ts` 定义 `posts`/`comments` 两表）
- **访问方式**：Drizzle ORM，`src/lib/db.ts` 单例连接池
- **缓存**：数据库查询不走 fetch Data Cache，用 `unstable_cache`（函数级缓存 + tags），见 `data-layer/caching-and-revalidation.md`
- **评论**：自建，存 PostGre（取代 Giscus），提交走 Server Action + `zod` 校验 + pending 审核流

## 关键边界

- **Server ↔ Client 边界**：通过 `'use client'` 指令标记。Server Component 可以渲染 Client Component，反之不行。Server Component 不能 import 浏览器专用模块。
- **Server Actions ↔ Route Handlers 边界**：内部数据变更走 Server Actions；对外接口（移动端、第三方 webhook）走 Route Handlers。详见 ADR-0002。
- **Static ↔ Dynamic 边界**：默认静态渲染，任何 `cookies()`/`headers()`/`searchParams` 访问或 `fetch` 未缓存时退化为动态。详见 `rendering-strategy.md`。
