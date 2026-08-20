import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * /archive 文章归档 —— 按 年 → 月 分组
 * 数据量小（博客场景），JS 分组足够，不额外建查询
 */
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const posts = await getPublishedPosts();

  // 按 年-月 分组
  // 注意：unstable_cache 会把 Date 序列化为字符串（ISO），必须先 new Date()
  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    if (!post.publishedAt) continue;
    const d = new Date(post.publishedAt);
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const list = groups.get(key) ?? [];
    list.push(post);
    groups.set(key, list);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 md:px-8 md:py-20">
      <FadeIn>
        <h1 className="mb-12 text-xs font-medium tracking-[0.25em] text-muted uppercase">归档</h1>
      </FadeIn>

      {groups.size === 0 ? (
        <p className="text-sm leading-6 text-muted">还没有文章。</p>
      ) : (
        <div className="space-y-12">
          {[...groups.entries()].map(([month, monthPosts], gi) => (
            <FadeIn key={month} delay={gi * 0.06}>
              <section>
                <h2 className="text-2xl font-semibold">{month}</h2>
                <ul className="mt-4 divide-y divide-line">
                  {monthPosts.map((post) => (
                    <li key={post.slug} className="flex items-baseline gap-6 py-3">
                      <time className="shrink-0 text-xs text-muted">
                        {formatDate(post.publishedAt)}
                      </time>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="truncate text-base transition-colors hover:text-muted"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          ))}
        </div>
      )}
    </main>
  );
}
