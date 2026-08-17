---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# 路由编写约定

## 私有文件夹 vs Route Group

| 语法 | 用途 | 示例 |
|------|------|------|
| `_folder/` | 不被路由系统暴露的私有文件 | `_lib/db.ts`、`_components/PostCard.tsx` |
| `(group)/` | Route Group：组织路由但不影响 URL | `(marketing)/about/page.tsx` → `/about` |

**关键区别**：
- `_folder/` 内的文件**永远不会**成为路由，Next.js 跳过它们——适合放共享逻辑、私有组件。
- `(group)/` 内的 `page.tsx` / `route.ts` **仍然是路由**，只是 grouping 不影响 URL 路径——适合共享 layout。

**反例**：在 `(dashboard)/` 下创建 `_components/` 和在 `src/components/` 下放了只给 dashboard 用的组件。正确做法是只给 dashboard 用的放 `(dashboard)/_components/`，多路由共享的放 `src/components/`。

## 动态路由命名

| 模式 | 示例 | 访问路径 |
|------|------|----------|
| `[slug]` | `blog/[slug]/page.tsx` | `/blog/hello-world` |
| `[...slug]` | `docs/[...slug]/page.tsx` | `/docs/a/b/c`（全捕获） |
| `[[...slug]]` | `docs/[[...slug]]/page.tsx` | `/docs` 和 `/docs/a/b`（可选全捕获） |

**选用规则**：
- 单个动态参数 → `[slug]`
- 多级路径（如文档嵌套）→ `[...slug]`
- 需要匹配根路径也匹配 → `[[...slug]]`

## 路由命名规范

- 文件名：**kebab-case**（`blog-post.tsx`，不是 `BlogPost.tsx` 或 `blogPost.tsx`）
- 动态路由参数：**camelCase** 单个词（`[postId]`，不是 `[post_id]` 或 `[PostId]`）
- Route Group：括号内 **kebab-case**（`(marketing)`，不是 `(Marketing)`）
- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `route.ts`：保留 Next.js 约定名，不可重命名

## Layout 嵌套

每个 layout 只负责它所包裹的那一层子路由的共享 UI，不要越级：

```
app/
├── layout.tsx                 # 根：<html> + <body> + metadata + 全局 Provider
├── (marketing)/
│   └── layout.tsx             # 营销：header + footer
│       └── blog/
│           └── layout.tsx     # 博客共享：侧边栏 + 目录
```

**反例**：在根 layout 里放 blog 特有的侧边栏——所有页面（包括 `/about`、`/dashboard`）都会渲染这个侧边栏。

## 路由重定向

- 需要鉴权的页面：在 layout 中用 `redirect()` 而非 `useEffect` + `useRouter`。
  ```ts
  // (dashboard)/layout.tsx
  import { redirect } from "next/navigation";
  import { getCurrentUser } from "@/lib/auth";

  export default async function DashboardLayout({ children }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <>{children}</>;
  }
  ```

- 不需要鉴权但需重定向的场景（如旧 URL → 新 URL）：在 `next.config.ts` 中配置 `redirects()`，而非 Server Component 中判断。

## 404 策略

- 全局 404：`app/not-found.tsx`（匹配所有未命中路由）
- 特定路由 404：在路由段内创建 `not-found.tsx`（如 `blog/[slug]/not-found.tsx`）
- 触发 404：`import { notFound } from "next/navigation"; notFound();`
