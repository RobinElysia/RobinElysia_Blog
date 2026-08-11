---
status: stable
owner: conventions
last-updated: 2025-07-11
related-adr: [0005]
---

# 数据获取约定

## 数据源：PostgreSQL（drizzle）

本项目数据源是 PostgreSQL，**所有数据读取走 `src/lib/` 下的数据访问函数**，不在组件里直接写 drizzle 查询。

```
组件（Server Component）
  ↓ import
src/lib/posts.ts（数据访问层，含 unstable_cache）
  ↓ drizzle
PostgreSQL
```

## 读取约定

1. **查询集中在 `src/lib/`**：`posts.ts`（文章）、`comments.ts`（评论）。组件只 import 函数，不 import `db` 单例。
2. **需要缓存的读取**：用 `unstable_cache` 包装（见 `data-layer/caching-and-revalidation.md`）。
3. **不需要缓存的读取**：评论等高频变化数据，直接查询。
4. **列表查询不读 content 字段**：文章列表只需要 `id/slug/title/excerpt/tags/publishedAt`——`content` 是大字段，列表页读它浪费 IO（schema 设计已保证）。

```ts
// ✅ 正确：数据访问函数
import { getPublishedPosts } from "@/lib/posts";
const posts = await getPublishedPosts();

// ❌ 错误：组件内直接查库
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
const rows = await db.select().from(posts).where(...); // 缓存、tag、复用性全部丢失
```

## 错误处理统一模式

```
数据获取失败
├── 预期内的结果（无文章、404）→ 组件内 if (!data) return <EmptyState />
├── 预期外的错误（数据库连接失败、500）→ 抛出错误 → error.tsx 捕获
└── 用户操作失败（评论提交失败）→ Server Action 返回 { ok: false, error: "..." }
```

```tsx
// ✅ 正确：预期外错误让 error.tsx 处理
async function BlogList() {
  const posts = await getPublishedPosts(); // 抛错 → 路由级 error.tsx 兜底
  if (posts.length === 0) return <EmptyState />; // 预期内空结果
  return <PostCards posts={posts} />;
}

// ❌ 错误：用 try/catch 吞掉错误并返回 null
async function BlogList() {
  try {
    const posts = await getPublishedPosts();
    return <PostCards posts={posts} />;
  } catch {
    return null; // 静默失败，用户看到空白，无法排查
  }
}
```

## 超时与连接

- 数据库连接池：`src/lib/db.ts` 单例（`pg` Pool），应用生命周期内复用。
- 连接失败：抛错走 error.tsx；不静默降级（空页面比错误页更糟——用户无法区分"没内容"和"系统挂了"）。
- 生产环境连接字符串走 `DATABASE_URL` 环境变量（`.env.example` 有模板）。

## Loading 状态模式

- **页面级**：`loading.tsx`（Next.js 自动以 Suspense 包裹 page.tsx）。
- **组件级**：`<Suspense fallback={<Skeleton />}>` 包裹独立数据区块。
- **粒度**：至少精确到"独立数据区块"，避免一个 loading 占满整个页面。

```tsx
<Page>
  <Suspense fallback={<PostListSkeleton />}>
    <PostList />
  </Suspense>
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments postId={id} />
  </Suspense>
</Page>
```
