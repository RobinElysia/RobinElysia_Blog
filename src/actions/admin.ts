"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * Dashboard 管理 Server Actions —— 全部先鉴权
 * 契约见 .harness/data-layer/server-actions-contract.md
 */

type ActionResult = { ok: true } | { ok: false; error: string };

/** 鉴权守卫：未登录返回错误 */
async function requireAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session) return { ok: false, error: "未登录" };
  return null;
}

const postSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "slug 不能为空")
    .max(200)
    .regex(/^[a-z0-9\u4e00-\u9fa5-]+$/, "slug 只允许小写字母、数字、中文和连字符"),
  excerpt: z.string().trim().min(1, "摘要不能为空").max(500),
  content: z.string().trim().min(1, "正文不能为空"),
  tags: z
    .string()
    .transform((s) => s.split(/[,，]/).map((t) => t.trim()).filter(Boolean).slice(0, 10)),
  status: z.enum(["draft", "published"]),
});

/** 新建文章 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    tags: formData.get("tags"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "表单不合法" };
  }

  await db.insert(posts).values({
    ...parsed.data,
    publishedAt: parsed.data.status === "published" ? new Date() : null,
  });

  revalidateTag("post-list", "max");
  redirect("/dashboard/posts");
}

/** 更新文章 */
export async function updatePost(postId: number, formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    tags: formData.get("tags"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "表单不合法" };
  }

  await db
    .update(posts)
    .set({
      ...parsed.data,
      // 从草稿发布时设置发布时间；保持已发布文章的 publishedAt 不变
      publishedAt: parsed.data.status === "published" ? new Date() : null,
    })
    .where(eq(posts.id, postId));

  revalidateTag("post-list", "max");
  redirect("/dashboard/posts");
}

/** 删除文章（评论级联删除） */
export async function deletePost(postId: number): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  await db.delete(posts).where(eq(posts.id, postId));
  revalidateTag("post-list", "max");
  redirect("/dashboard/posts");
}
