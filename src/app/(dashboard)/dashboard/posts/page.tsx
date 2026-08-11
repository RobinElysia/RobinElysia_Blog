import Link from "next/link";
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatDate } from "@/lib/format";
import { deletePost } from "@/actions/admin";
import { DeletePostForm } from "@/components/admin/delete-post-form";

/** 文章管理列表 */
export const dynamic = "force-dynamic";

export default async function DashboardPosts() {
  const all = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      publishedAt: posts.publishedAt,
      commentCount: sql<number>`(
        SELECT count(*) FROM comments c WHERE c.post_id = ${posts.id}
      )`,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">文章管理</h1>
        <Link
          href="/dashboard/posts/new"
          className="border border-ink bg-ink px-4 py-2 text-xs tracking-[0.2em] text-paper uppercase transition-opacity hover:opacity-80"
        >
          新建文章
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-line">
        {all.map((post) => (
          <li key={post.id} className="flex items-center gap-4 py-4">
            <span
              className={`shrink-0 border px-2 py-0.5 text-xs ${
                post.status === "published"
                  ? "border-ink text-ink"
                  : "border-line text-muted"
              }`}
            >
              {post.status === "published" ? "已发布" : "草稿"}
            </span>
            <Link href={`/blog/${post.slug}`} className="min-w-0 flex-1 truncate text-sm hover:text-muted">
              {post.title}
            </Link>
            <span className="shrink-0 text-xs text-muted">
              {post.commentCount} 评论
            </span>
            <span className="hidden shrink-0 text-xs text-muted sm:inline">
              {formatDate(post.publishedAt)}
            </span>
            <div className="flex shrink-0 gap-3 text-xs">
              <Link href={`/dashboard/posts/${post.id}/edit`} className="text-muted hover:text-ink">
                编辑
              </Link>
              <DeletePostForm postId={post.id} onDelete={deletePost} />
            </div>
          </li>
        ))}
        {all.length === 0 && <li className="py-4 text-sm text-muted">还没有文章。</li>}
      </ul>
    </div>
  );
}
