---
status: stable
owner: data-layer
last-updated: 2026-08-20
related-adr: [0002, 0005]
---

# Server Action 契约

## 返回值形状

**规则**：所有 Server Action 统一返回 `{ ok: true } | { ok: false; error: string }`，不直接 throw（本项目实际用法，见 `src/actions/comment.ts`、`src/actions/admin.ts`）：

```ts
type ActionResult =
  | { ok: true }
  | { ok: false; error: string };
```

**原因**：`throw` 会导致 Server Action 被 Next.js 视为未处理异常，触发全局 error boundary。而 `return { ok: false, error: "..." }` 让调用方可以就近处理错误（如表单字段高亮、toast 提示），不会让整个页面炸掉。

## 完整示例：评论提交（zod 校验 + IP 防刷 + 写 PostGre）

> 对齐实际代码 `src/actions/comment.ts`（v0.7.0 起无审核流，提交即 approved 直接显示）：

```ts
// src/actions/comment.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { comments, posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";

// zod 校验 schema：规则集中在 action 文件内，与表单共享
const commentSchema = z.object({
  postId: z.coerce.number().int().positive(),
  authorName: z.string().trim().min(1, "昵称不能为空").max(50, "昵称最长 50 字"),
  content: z.string().trim().min(1, "评论不能为空").max(1000, "评论最长 1000 字"),
});

export type CommentActionResult = { ok: true } | { ok: false; error: string };

export async function submitComment(
  _prev: unknown, // useActionState 协议要求，本 action 不读取
  formData: FormData,
): Promise<CommentActionResult> {
  // ① zod 校验（包含类型转换：postId 来自 form 是 string）
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    authorName: formData.get("authorName"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    // 返回第一条校验错误的人类可读消息（zod 自定义 message）
    const firstError = parsed.error.issues[0]?.message ?? "评论内容不合法";
    return { ok: false, error: firstError };
  }

  // ①b 防刷：同一 IP 60s 窗口最多 3 次（进程内存实现，多实例部署失效）
  sweepRateLimits();
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`comment:${ip}`)) {
    return { ok: false, error: "提交过于频繁，请稍后再试" };
  }

  // ② 确认文章存在（postId 来自表单，防伪造）
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, parsed.data.postId))
    .limit(1);
  if (post.length === 0) {
    return { ok: false, error: "文章不存在" };
  }

  // ③ 写库：直接 approved（v0.7.0 起无审核流，提交即显示）
  await db.insert(comments).values({
    postId: parsed.data.postId,
    authorName: parsed.data.authorName,
    content: parsed.data.content,
    status: "approved",
  });

  // ④ 评论查询不缓存 → 无需 revalidate
  return { ok: true };
}
```

## 客户端消费约定

优先使用 React 19 的 `useActionState` 处理状态流转：

```tsx
"use client";
import { useActionState } from "react";
import { submitComment } from "@/actions/comment";

export function CommentForm({ postId }: { postId: number }) {
  const [result, action, isPending] = useActionState(submitComment, { ok: true });

  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <input name="authorName" placeholder="昵称" required maxLength={50} />
      <textarea name="content" placeholder="评论内容" required maxLength={1000} />
      {result.ok === false && <p className="text-red-500">{result.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "提交中..." : "提交评论"}
      </button>
    </form>
  );
}
```

## 校验约定

- **所有用户输入必须过 zod**（或等价校验库），服务端是最后一道防线——客户端校验可以绕过。
- 校验 schema 定义在 action 文件内（单一职责），如需与表单共享类型可导出 `z.infer`。
- 校验失败返回 `{ ok: false, error: "人类可读的提示" }`，不抛异常。

## 鉴权约定

每个 Server Action 内部自行鉴权，不依赖 Middleware：

```ts
"use server";
export async function deleteComment(commentId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "无权操作" };
  }
  // ... 执行删除
}
```

**原因**：Middleware 在 Edge Runtime 运行，无法直接访问数据库做细粒度权限校验。Server Action 跑在 Node.js Runtime，可以做完整的权限判断。

## 不适用 useActionState 的场景

- **按钮触发的非表单操作**：直接用 `startTransition` + `async/await`。
- **需要乐观更新的操作**：配合 `useOptimistic`。
- **客户端数据获取（只读）**：不用 Server Action，Server Component 直接查库。
