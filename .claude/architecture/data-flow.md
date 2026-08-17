---
status: stable
owner: architecture
last-updated: 2025-07-11
related-adr: [0002, 0005]
---

# 数据流完整链路

## 读数据链路：用户访问 `/blog/[slug]`

```
用户浏览器
  │
  │ GET /blog/hello-world
  ▼
Next.js Server
  │
  │ 1. 路由匹配 → app/(marketing)/blog/[slug]/page.tsx
  │
  │ 2. generateMetadata() 执行（如有）
  │    从 PostGre 读取 title/description → 注入 <head>
  │
  │ 3. Page Server Component 执行
  │    getPostBySlug("hello-world")   ← src/lib/posts.ts
  │    ┌─────────────────────────────────────┐
  │    │ unstable_cache 命中？               │
  │    │  ├─ 命中 → 直接返回缓存结果          │
  │    │  └─ 未命中 → drizzle 查询 PostGre    │
  │    │       → 写入缓存（tag: post-list）   │
  │    └─────────────────────────────────────┘
  │    机制：unstable_cache 函数级缓存（替代 fetch Data Cache）
  │
  │ 4. 评论查询（不缓存）
  │    getApprovedComments(postId) → 直接 drizzle 查询
  │
  │ 5. RSC Payload 序列化
  │    包含：Server Component 渲染结果 + Client Component 占位符
  │
  │ 6. HTML stream 开始发送
  │    ├── <head> (metadata)
  │    ├── Shell HTML（根 layout 渲染结果）
  │    ├── Page HTML（page.tsx 渲染结果）
  │    └── Suspense 边界内的内容以 stream 方式逐块发送
  │
  ▼
用户浏览器
  │
  │ 7. HTML 渐进渲染（非交互状态，内容已可见）
  │
  │ 8. RSC Payload 到达 → React 调和
  │
  │ 9. Client Components 水合 → 可交互
  │
  ▼
页面完全可交互
```

## 写数据链路：用户提交评论

```
用户浏览器
  │
  │ 用户填写评论表单 → form action={submitComment}
  ▼
Next.js Server
  │
  │ 1. Server Action 执行（src/actions/comment.ts）
  │    "use server"
  │    submitComment(prev, formData):
  │      ├─ ① zod 校验（postId/authorName/content）
  │      │    └─ 失败 → return { ok: false, error: "..." }
  │      ├─ ② db.insert(comments).values({ ... })  ← 写 PostGre
  │      │    默认 status = "pending"
  │      └─ ③ revalidateTag(`post:${postId}`, "max")
  │
  │ 2. 响应返回客户端
  │    useActionState 自动更新表单状态
  │
  ▼
用户浏览器
  │
  │ 3. UI 更新：显示"评论已提交，审核后可见"
  │
  ▼
完成
```

## 审核链路（Dashboard，管理员）

```
管理员登录 Dashboard（NextAuth）
  │
  │ 1. 查询 pending 评论列表
  │    db.select().from(comments).where(status = "pending")
  │
  │ 2. Server Action: approveComment(id) / markSpam(id)
  │    ├─ status: pending → approved / spam
  │    └─ 评论表不缓存 → 无需 revalidate
  ▼
C 端文章页下一次渲染即显示已通过评论
```

## 每一步使用的机制汇总

| 步骤 | 机制 | 关键 API |
|------|------|----------|
| 数据读取 | Server Component 调用数据访问层 | `src/lib/posts.ts` |
| 缓存 | `unstable_cache` 函数级缓存 | `unstable_cache(fn, keys, { tags, revalidate })` |
| 缓存失效 | Tag-based revalidation | `revalidateTag("post-list", "max")` |
| 写数据 | Server Actions + drizzle | `"use server"` + `db.insert()` |
| 校验 | zod schema | `z.object({...}).safeParse()` |
| 流式传输 | React Suspense + Streaming | `<Suspense fallback={...}>` |
| UI 更新 | RSC Payload diff | 自动，Next.js Router 处理 |
