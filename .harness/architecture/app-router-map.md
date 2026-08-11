---
status: stable
owner: architecture
last-updated: 2025-07-11
related-adr: [0001]
---

# App Router 路由地图

## 路由树结构

```
src/app/
├── layout.tsx              # 根布局：全局 <html>/<body>、字体（Inter+Italianno）、metadata
├── page.tsx                # 首页 "/"：花体 Hero + 最近文章（SSR，force-dynamic）
├── loading.tsx             # 首页 Suspense fallback
├── error.tsx               # 首页错误边界
├── not-found.tsx           # 全局 404
│
├── (marketing)/            # Route Group：无需鉴权的公开页面
│   ├── layout.tsx           # 营销页共享布局（header/footer）
│   ├── about/page.tsx       # /about
│   └── blog/
│       ├── page.tsx         # /blog（文章列表，PostGre 读取）
│       ├── [slug]/page.tsx  # /blog/:slug（文章详情 + 评论）
│       └── [slug]/loading.tsx
│
├── (dashboard)/            # Route Group：需鉴权的后台页面
│   ├── layout.tsx           # 后台共享布局（侧边栏 + 顶栏，NextAuth 保护）
│   ├── dashboard/page.tsx   # /dashboard（文章管理、评论审核）
│   └── settings/page.tsx    # /settings
│
├── feed.xml/route.ts       # RSS Feed（从 PostGre 读）
├── sitemap.xml/route.ts    # Sitemap（从 PostGre 读）
│
└── _lib/                   # 私有文件夹：不被路由系统暴露
    ├── db.ts               # 数据库客户端（drizzle 单例）
    ├── schema.ts           # PostGre 表结构（posts/comments）
    ├── posts.ts            # 文章数据访问层（unstable_cache）
    ├── format.ts           # 日期/阅读时长工具
    └── auth.ts             # 鉴权逻辑（NextAuth，Dashboard 用）
```

## 路由分组意图

### `(marketing)`
- **用途**：所有无需登录即可访问的页面。
- **为什么分组**：与 `(dashboard)` 共享同一 URL 空间（不影响 URL 路径），但 layout 完全不同——营销页是 header/footer 布局，后台是侧边栏布局。如果不分组，两个 layout 只能选一个挂在根节点，另一种页面的布局就得通过客户端路由判断来切换，增加水合成本且不优雅。

### `(dashboard)`
- **用途**：需要鉴权的后台页面。
- **为什么分组**：隔离鉴权逻辑——`(dashboard)/layout.tsx` 中集中做登录检查，未登录重定向到 `/login`，比在每个页面里散落 `if (!user) redirect(...)` 更可靠。

## 私有文件夹约定

- `_lib/`：放不被路由系统暴露的共享逻辑（数据库客户端、Schema、数据访问层、鉴权）。实际目录为 `src/lib/`（src 目录布局），`app/` 下的 `_lib/` 语法同理。
- `_components/`：页面级私有组件。如果一个组件只被某个路由使用，放在该路由的 `_components/` 目录下；如果被多个路由共享，提升到 `src/components/`。

## 鉴权边界（用户决策）

- **C 端（公开页面：首页、/blog、文章详情）不需要鉴权**——全部走 `(marketing)/`。
- **Dashboard 需要鉴权**（NextAuth v5）——`(dashboard)/layout.tsx` 集中做登录检查，未登录 `redirect("/login")`。
- 不引入全局鉴权中间件——C 端页面不能被拖进鉴权流程。

## 当前 Parallel/Intercepting Routes

暂无。如果需要模态路由（如 `/photos/[id]` 在 `/photos` 页面上以模态框打开），使用 `@modal` 并行路由 + `(.)photo/[id]` 拦截路由。
