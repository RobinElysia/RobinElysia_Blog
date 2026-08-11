"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { comments, posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";

/**
 * 评论提交 Server Action
 * 契约见 .harness/data-layer/server-actions-contract.md：
 * - 返回 { ok, error }，不 throw
 * - zod 校验所有用户输入
 * - 新评论默认 pending（审核后可见）
 */

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
  // ① zod 校验
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    authorName: formData.get("authorName"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "评论内容不合法";
    return { ok: false, error: firstError };
  }

  // ①b 防刷：同一 IP 60s 窗口最多 3 次（ADR-0005 承诺的"基本盘"）
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

  // ③ 写库（直接 approved——v0.7.0 起评论不审核，提交即显示）
  await db.insert(comments).values({
    postId: parsed.data.postId,
    authorName: parsed.data.authorName,
    content: parsed.data.content,
    status: "approved",
  });

  // ④ 评论查询不缓存，无需 revalidate；评论计数若未来缓存则在此失效
  return { ok: true };
}
