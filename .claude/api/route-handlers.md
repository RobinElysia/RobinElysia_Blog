---
status: stable
owner: api
last-updated: 2026-08-22
related-adr: [0002, 0006]
---

# Route Handlers

## 当前 Route Handler 清单

| 路径 | 用途 | 消费者 | 实现 |
|------|------|--------|------|
| `/feed.xml` | RSS Feed | RSS 阅读器 | `app/feed.xml/route.ts`（已实现） |
| `/sitemap.xml` | Sitemap | 搜索引擎 | `app/sitemap.ts`（Next.js 内置约定，已实现） |
| `/api/upload-image` | 文章图片上传（PostGre BYTEA） | 编辑器（仅 admin） | `app/api/upload-image/route.ts`（已实现） |
| `/api/images/[id]` | 图片服务（公开、永久缓存） | 文章 `<img>` | `app/api/images/[id]/route.ts`（已实现） |
| `/api/archive-candidates` | 档案图候选获取（Wellcome 检索+下载入库，v0.22.0） | 编辑器（仅 admin） | `app/api/archive-candidates/route.ts`（已实现） |
| `/api/revalidate` | 按需 Revalidation | 未来 CMS/CI webhook（预留） | 未实现 |

> **评论系统已改为自建（PostGre）**：评论提交走 Server Action（`src/actions/comment.ts`），不需要 webhook 端点。
> **不再有 Giscus webhook**——Giscus 方案已在 ADR-0005 中否决。

## 为什么这些不用 Server Actions？

- **RSS / Sitemap**：需要返回 XML 格式、自定义 Content-Type 和 Cache-Control 头。Server Actions 只能返回 JSON 序列化的对象。
- **Revalidation**：外部系统（CMS/CI）通过 POST 调用，不知道什么是 Server Actions。Route Handlers 提供标准的 REST 端点。

## Route Handler 编写规范

```ts
// app/feed.xml/route.ts
import { getPublishedPosts } from "@/lib/posts";
import { generateRssFeed } from "@/lib/feed";

export async function GET() {
  const posts = await getPublishedPosts();
  const xml = generateRssFeed(posts, siteUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
```

**规则**：
- Route Handler 的返回值不需要统一格式（不像 Server Actions 的 `ActionResult<T>`）——每个端点返回各自的格式。
- 数据获取复用 `src/lib/` 的数据访问函数（`getPublishedPosts` 自带缓存），不在 Handler 里重复查询。

**Sitemap 用内置约定**：`app/sitemap.ts` 导出 `MetadataRoute.Sitemap`（自动路由到 `/sitemap.xml`），不需要手写 route.ts。RSS 因为没有内置约定才用 Route Handler。

## 鉴权方式

| 端点 | 鉴权方式 |
|------|----------|
| `/feed.xml` | 无鉴权（公开） |
| `/sitemap.xml` | 无鉴权（公开） |
| `/api/revalidate` | 共享 secret（环境变量 `REVALIDATION_SECRET`） |
| `/api/archive-candidates` | 仅 admin（`auth()` 检查，同 `/api/upload-image`）+ 60s/5 次限流（外呼上游 API 需限制频率） |
