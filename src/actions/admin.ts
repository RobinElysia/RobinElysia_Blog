"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getImageById, parseImageIdFromSrc } from "@/lib/images";
import { formatCredit } from "@/lib/archive-images";

/**
 * Dashboard 管理 Server Actions —— 全部先鉴权
 * 契约见 .claude/data-layer/server-actions-contract.md
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
  // 封面图片（可选）：空字符串 → null；/api/images/{id}（编辑器档案图绑定）或 /archive/ 路径或 URL
  coverImage: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v)),
  tags: z.string().transform((s) =>
    s
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
  ),
  status: z.enum(["draft", "published"]),
});

/**
 * 封面署名解析（v0.22.0）：
 * - coverImage 是 /api/images/{id} → 查 images 表元数据生成署名行（服务端生成，不信任客户端）
 * - 其他（/archive/ 静态路径 / 外链 URL / null）→ coverCredit = null，展示层回退 slug 映射
 * - 引用了不存在的图片 id → 返回错误（防止编辑器绑定已清扫的孤儿图）
 */
async function resolveCoverCredit(
  coverImage: string | null,
): Promise<{ credit: string | null; error?: string }> {
  if (!coverImage) return { credit: null };
  const id = parseImageIdFromSrc(coverImage);
  if (id === null) return { credit: null };
  const img = await getImageById(id);
  if (!img) return { credit: null, error: "绑定的封面图片不存在，请重新选择" };
  return {
    credit: formatCredit({
      src: coverImage,
      title: img.title ?? "",
      creator: img.creator ?? "",
      date: img.date ?? "",
      source: img.source ?? "",
      sourceUrl: img.sourceUrl ?? "",
      license: img.license ?? "",
    }),
  };
}

/** 新建文章 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage"),
    tags: formData.get("tags"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "表单不合法" };
  }

  const cover = await resolveCoverCredit(parsed.data.coverImage);
  if (cover.error) return { ok: false, error: cover.error };

  await db.insert(posts).values({
    ...parsed.data,
    coverCredit: cover.credit,
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
    coverImage: formData.get("coverImage"),
    tags: formData.get("tags"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "表单不合法" };
  }

  const cover = await resolveCoverCredit(parsed.data.coverImage);
  if (cover.error) return { ok: false, error: cover.error };

  await db
    .update(posts)
    .set({
      ...parsed.data,
      coverCredit: cover.credit,
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
