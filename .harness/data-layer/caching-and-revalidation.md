---
status: stable
owner: data-layer
last-updated: 2025-07-11
related-adr: [0005]
---

# 缓存与 Revalidation

## 核心规则：数据库查询不用 fetch 缓存

**fetch Data Cache 只对 `fetch()` 生效。** 本项目数据源是 PostgreSQL（drizzle 直连），查询不走 fetch——所有需要缓存的数据库读取必须用 **`unstable_cache`** 包装：

```ts
// src/lib/posts.ts
import { unstable_cache } from "next/cache";

export const getPublishedPosts = unstable_cache(
  async () => { /* drizzle 查询 */ },
  ["post-list"],                 // keyParts：缓存键
  { tags: ["post-list"], revalidate: 300 },
);
```

**反例**：直接调用 drizzle 查询而不包 `unstable_cache`——每次请求都打数据库；或者试图用 `fetch` + `cache: "force-cache"` 包数据库查询——fetch 缓存不生效（查询不是 HTTP 请求），白写。

## Cache Tag 命名规范

| Tag | 用途 | 失效时机 |
|-----|------|----------|
| `post:{slug}` | 单篇文章 | 文章编辑/发布时 |
| `post-list` | 文章列表（首页 + /blog） | 任何文章状态变化时 |
| `user:{id}` | 用户数据 | 用户信息变更时 |

**与 fetch 时代的差异**：tags 现在挂在 `unstable_cache` 的 options 上，不是 fetch 的 `next` 选项。

## 写入后失效（revalidateTag）

所有数据变更操作（Server Action）结束后必须显式失效缓存。**Next.js 16 起 `revalidateTag` 必须传第二个参数（profile），推荐 `"max"`（stale-while-revalidate 语义）；单参数形式已废弃**：

```ts
"use server";

export async function submitComment(formData: FormData) {
  // ... 校验 + 写库
  revalidateTag(`post:${slug}`, "max"); // Next.js 16：tag + profile 双参数
}
```

**规则**：评论通过审核（Dashboard 操作）后，`revalidateTag("post-list", "max")` 不需要——评论不进入列表缓存。只有影响 `posts` 表内容的操作才失效 `post-list` / `post:{slug}`。

## revalidatePath vs revalidateTag

| API | 适用场景 | 优缺点 |
|-----|----------|--------|
| `revalidateTag(tag, "max")` | 数据级失效（推荐） | 精确，只清关联数据；Next.js 16 双参数 |
| `revalidatePath(path)` | 页面级失效 | 简单但粒度粗 |

**选用规则**：数据库时代优先 `revalidateTag`——一个 tag 失效所有引用它的缓存（首页 + 列表页 + 详情页一次清干净）。

## 评论数据不缓存

评论变化频率高（提交、审核、删除），且需要实时可见——**不缓存**，每次查询：

```ts
export async function getApprovedComments(postId: number) {
  // 无 unstable_cache 包装
  return db.select().from(comments).where(...);
}
```

## 开发环境警告

`next dev` 中 `unstable_cache` **不会真正缓存**（每次请求重新执行，行为同 fetch）。验证缓存策略的唯一方式是生产构建（`next build && next start`）。

## ⚠️ unstable_cache 的 Date 序列化坑（踩坑记录）

`unstable_cache` 会把函数返回值序列化后缓存（RSC 缓存格式），**Date 对象变成 ISO 字符串**。首次请求（未命中）拿到 Date，缓存命中后拿到 string——类型标注 `Date | null` 但运行时是 `string`，直接调用 `.getFullYear()` 会崩。

**规则**：所有经 `unstable_cache` 返回的日期字段，消费方一律先 `new Date(value)` 再使用（`src/app/(marketing)/archive/page.tsx`、`src/lib/posts.ts` 的 `getAdjacentPosts` 均已处理）。数据访问层可统一约定：把返回的日期字段序列化为 `string` 类型标注（`publishedAt: string | null`），从类型层面杜绝误用——尚未实施，见 tech-debt。
