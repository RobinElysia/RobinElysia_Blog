---
status: stable
owner: architecture
last-updated: 2025-07-11
---

# ADR 0001: 选用 App Router 而非 Pages Router

## 背景

Next.js 16 同时支持 App Router 和 Pages Router。需要在新项目启动时决定路由方案。

## 决策

**选用 App Router。**

## 理由

1. **Server Components 是 React 未来的默认范式**。Pages Router 基于 React 18 的页面级 SSR 模型，无法使用 Server Components。用 Pages Router 意味着完全放弃 RSC 带来的零客户端 JS 体积优势。
2. **布局嵌套**。App Router 的 `layout.tsx` 嵌套机制（同一 route group 内的 page 自动继承 layout）让鉴权、主题、侧边栏这类跨路由 UI 处理变得自然。Pages Router 需要在每个页面手动包裹或使用 `_app.tsx` 中的全局判断，前者冗余、后者不灵活。
3. **Streaming 与 Suspense**。App Router 原生支持 `<Suspense>` 边界的 Streaming SSR。Pages Router 需要手动配置 `getServerSideProps` + 客户端 Suspense，且无法 stream。
4. **Next.js 官方的长期方向**。Vercel 已明确 App Router 是推荐方案，Pages Router 保留是为了迁移兼容。新项目没有理由选择即将进入维护模式的方案。

## 代价

1. **学习成本**：React Server Components 的心智模型（`'use client'` 边界、序列化限制）与传统的"一切皆客户端"React 开发完全不同。团队需要适应。
2. **第三方库兼容性**：大量 React 生态库（状态管理、动画、图表）需要 `'use client'` 标记，导致部分子树失去 RSC 优势。详见 `architecture/server-client-boundary.md` 中的黑名单。

## 替代方案

| 方案 | 为什么不选 |
|------|-----------|
| Pages Router | 无法使用 RSC、layout 嵌套、Streaming |
| 混合使用两种 Router | 增加路由歧义和维护负担，Vercel 不推荐 |
| Remix / other framework | 团队技能栈偏 Next.js，迁移成本不划算 |

## 生效日期

2025-07-11（项目初始化时确定）
