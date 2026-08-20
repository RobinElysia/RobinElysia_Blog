---
status: stable
owner: architecture
last-updated: 2026-08-20
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
  │      ├─ ①b 防刷：IP 固定窗口限流（60s/3 次，进程内存 Map，按首次命中锚定）
  │      │    └─ 超限 → return { ok: false, error: "提交过于频繁" }
  │      ├─ ② 确认文章存在（postId 来自表单，防伪造）
  │      ├─ ③ db.insert(comments).values({ ..., status: "approved" })
  │      │    ← 写 PostGre；v0.7.0 起无审核流，提交即 approved 直接显示
  │      └─ ④ 评论查询不缓存 → 无需 revalidateTag
  │
  │ 2. 响应返回客户端
  │    useActionState 自动更新表单状态
  │
  ▼
用户浏览器
  │
  │ 3. UI 更新：显示"评论已提交。"
  │
  ▼
完成
```

> ⚠️ **当前无内容审核**：评论提交即显示，唯一的防线是 IP 限流（进程内存实现，多实例部署下失效）。垃圾评论治理见 `future/roadmap.md`「评论反垃圾」。

## 每一步使用的机制汇总

| 步骤 | 机制 | 关键 API |
|------|------|----------|
| 数据读取 | Server Component 调用数据访问层 | `src/lib/posts.ts` |
| 缓存 | `unstable_cache` 函数级缓存 | `unstable_cache(fn, keys, { tags, revalidate })` |
| 缓存失效 | Tag-based revalidation | `revalidateTag("post-list", "max")` |
| 写数据 | Server Actions + drizzle | `"use server"` + `db.insert()` |
| 校验 | zod schema | `z.object({...}).safeParse()` |
| 防刷 | 内存固定窗口（IP 维度，按首次命中锚定） | `src/lib/rate-limit.ts`（60s/3 次） |
| 流式传输 | React Suspense + Streaming | `<Suspense fallback={...}>` |
| UI 更新 | RSC Payload diff | 自动，Next.js Router 处理 |
