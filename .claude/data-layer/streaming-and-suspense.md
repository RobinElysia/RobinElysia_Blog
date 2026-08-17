---
status: stable
owner: data-layer
last-updated: 2025-07-11
---

# Streaming 与 Suspense

## Suspense 边界粒度

**规则**：每个**独立的数据区块**对应一个 Suspense 边界。判断"独立"的标准是——两个数据源之间没有依赖关系，且它们的加载时间可能不同。

```tsx
// 文章页面
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <article>
      {/* ① 文章正文：慢（需解析 MDX）→ 自己的 Suspense */}
      <Suspense fallback={<PostSkeleton />}>
        <PostBody slug={params.slug} />
      </Suspense>

      {/* ② 作者信息：快（小查询）→ 自己的 Suspense */}
      <Suspense fallback={<AuthorSkeleton />}>
        <AuthorInfo slug={params.slug} />
      </Suspense>

      {/* ③ 评论：慢（第三方 API）→ 自己的 Suspense + 独立 error boundary */}
      <ErrorBoundary fallback={<CommentError />}>
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments slug={params.slug} />
        </Suspense>
      </ErrorBoundary>
    </article>
  );
}
```

**反例**：用一个 `<Suspense>` 包裹整个页面——三个数据源中最慢的那个拖累整个页面的首屏。

## loading.tsx 骨架规范

`loading.tsx` 是路由级别的 Suspense fallback。编写规则：

1. **精确到结构**：骨架的形状应与真实内容形状一致，不要用一个旋转的 spinner 代替整个页面。
2. **不含文字**：骨架中不应出现真实文字（可能造成布局偏移），用灰色块代替。
3. **不含交互元素**：骨架中的按钮、链接不应可点击。

```tsx
// app/blog/[slug]/loading.tsx
export default function BlogPostLoading() {
  return (
    <article className="max-w-2xl mx-auto animate-pulse">
      {/* 标题骨架 */}
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
      {/* 日期骨架 */}
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
      {/* 正文骨架（多行） */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </article>
  );
}
```

## Streaming 边界

Streaming 自动工作——只要用了 `<Suspense>`，Next.js 就会在 SSR 时 stream 内容。不需要额外配置。

但以下场景 **不应** stream：

| 场景 | 原因 |
|------|------|
| SEO 关键内容（文章标题、meta description） | Streaming 延迟可能导致搜索引擎抓取不到 |
| `generateMetadata` 中依赖的数据 | metadata 必须是同步的，等不了 Suspense |
| 根 layout 中的内容 | layout 在 page 之前渲染，不适合 Suspense |

**处理 SEO 关键内容**：在 `generateMetadata` 中提前获取 SEO 数据，不要在 Suspense 包裹的组件中渲染 `<title>`。

## ⚠️ loading.tsx 与 404 状态码的冲突（踩坑记录）

**路由段存在 `loading.tsx` 时，该段 page 中 `notFound()` 无法返回 404 状态码。**

机制：`loading.tsx` 会让 Next.js 把 page 包进 Suspense 流式渲染——shell（loading 骨架）先发出（HTTP 200），随后 async page 的 `notFound()` 只能在 RSC 流中注入 `NEXT_HTTP_ERROR_FALLBACK;404`，**HTTP 状态码已无法更改**（响应已开始）。

**规则**：需要真实 404 状态码的路由段（SEO、监控、爬虫有意义）**不要放 `loading.tsx`**。没有 loading.tsx 时，async page 整体渲染完成后才发流，`notFound()` 能正确设置状态码。

**反例**：`/blog/[slug]` 曾配有 `loading.tsx`，访问不存在的 slug 返回 200 + noindex 页。移除 loading.tsx 后返回正确 404。

**全局 loading.tsx 同样影响**：`app/loading.tsx` 包裹所有路由（含 [slug]），实测 404 状态码回归为 200（v0.5.0 踩坑）。**本项目的取舍：全局不配 loading.tsx**（首页/列表查询有 unstable_cache 兜底，<100ms），需要骨架屏的地方用组件级 `<Suspense>`。

**替代方案**：不用 loading.tsx 的页面，用组件级 `<Suspense fallback={<Skeleton />}>` 包裹独立数据区块（不破坏 notFound）。

## Error Boundary 与 Suspense 的合作

```
<Suspense fallback={<Skeleton />}>
  <ErrorBoundary fallback={<ErrorState />}>
    <AsyncComponent />
  </ErrorBoundary>
</Suspense>
```

- **外层 Suspense**：捕获 loading 状态
- **内层 ErrorBoundary**：捕获 error 状态
- `error.tsx` 自动成为该路由的 ErrorBoundary，不需要手动包裹

如果组件需要**独立的 error 展示**（与路由级 error.tsx 不同），才手动加 ErrorBoundary。
