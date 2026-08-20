import Link from "next/link";
import { db } from "@/lib/db";
import { posts, comments } from "@/lib/schema";
import { count, eq } from "drizzle-orm";
import { getRecentPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";

/** Dashboard 概览：统计 + 最近文章 */
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const [postCount, commentCount, publishedCount, recent] = await Promise.all([
    db.select({ c: count() }).from(posts),
    db.select({ c: count() }).from(comments),
    db.select({ c: count() }).from(posts).where(eq(posts.status, "published")),
    getRecentPosts(5),
  ]);

  const stats = [
    { label: "文章总数", value: Number(postCount[0]?.c ?? 0) },
    { label: "已发布", value: Number(publishedCount[0]?.c ?? 0) },
    { label: "评论总数", value: Number(commentCount[0]?.c ?? 0) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">概览</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line p-5">
            <div className="text-3xl font-semibold">{s.value}</div>
            <div className="mt-1 text-xs tracking-[0.2em] text-muted uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">最近文章</h2>
          <Link href="/dashboard/posts" className="text-xs text-muted hover:text-ink">
            全部 →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {recent.map((post) => (
            <li key={post.slug} className="flex items-baseline justify-between gap-4 py-3">
              <Link href={`/blog/${post.slug}`} className="truncate text-sm hover:text-muted">
                {post.title}
              </Link>
              <span className="shrink-0 text-xs text-muted">{formatDate(post.publishedAt)}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="py-3 text-sm text-muted">还没有文章。</li>}
        </ul>
      </div>
    </div>
  );
}
