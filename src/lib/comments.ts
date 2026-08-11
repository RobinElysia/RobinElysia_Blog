import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * 评论数据访问层 —— 评论变化频繁且需实时可见，不缓存（见 caching-and-revalidation.md）
 */

/** 文章的已通过评论 */
export async function getApprovedComments(postId: number) {
  return db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, "approved")))
    .orderBy(desc(comments.createdAt));
}
