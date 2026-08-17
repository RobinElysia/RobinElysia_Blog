---
status: stable
owner: architecture
last-updated: 2025-07-11
related-adr: [0005]
---

# 渲染策略选型

数据源已确定为 PostgreSQL（drizzle 直连）。**所有页面默认动态渲染（SSR）**，静态化按路由粒度逐步启用。

## 决策矩阵

| 路由 | 渲染模式 | 选择理由 | 缓存策略 |
|------|----------|----------|----------|
| `/` (首页) | SSR（force-dynamic） | 首页显示最近文章，发布后需立即可见 | `unstable_cache` + `post-list` tag |
| `/blog` | SSR → 可升 ISR | 文章列表更新频率中等（每天 1-3 篇） | `unstable_cache` revalidate=300s |
| `/blog/[slug]` | SSR → 可升 ISR | 文章发布后很少修改 | `unstable_cache` revalidate=300s |
| `/dashboard` | SSR | 后台数据个性化，且需鉴权 | 不缓存（每次查询） |
| `/settings` | CSR（客户端获取） | 设置页交互密集、数据完全个人化 | 不适用 |

> **为什么现在用 SSR 而不是 ISR？** 数据库直连后 ISR 可行（`unstable_cache` 支持 `revalidate`），
> 但 ISR 的 `revalidate` 是时间窗口——新文章发布后最长 N 秒才出现。
> 已通过 Server Action 内的 `revalidateTag("post-list")` 实现**按需失效**（发布即可见），
> 因此先保持 SSR 简单可靠；流量上来后再对 `/blog` 和 `/blog/[slug]` 启用 ISR + on-demand revalidation。

## 选型判断流程

```
这个页面的数据是否依赖当前用户？
├── 是 → SSR（动态渲染）
│   └── 页面交互是否极度密集（表单 > 10 个字段）？
│       └── 是 → CSR（客户端数据获取 + Suspense）
│
├── 否 → 数据变化频率？
    ├── 从不变化 → SSG（构建时生成）
    ├── 偶尔变化 → ISR（unstable_cache revalidate 或按需 revalidateTag）
    └── 频繁变化 → SSR（动态渲染）
```

## 关键决策

1. **数据库查询不经过 fetch Data Cache**。Next.js 的 fetch 缓存只对 `fetch()` 生效；数据库直连（drizzle）必须用 `unstable_cache` 包装查询函数（见 `src/lib/posts.ts`）。
2. **页面级动态标记**：首页用 `export const dynamic = "force-dynamic"`，避免 `next build` 时尝试静态预渲染而连接数据库。
3. **评论数据不缓存**：评论变化频繁且每次展示要求新鲜，直接查询（`getApprovedComments` 无缓存包装）。
