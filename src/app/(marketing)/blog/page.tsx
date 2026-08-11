import Link from "next/link";
import { getPublishedPosts, getPostsByTag, getPostsPage } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * /blog 文章列表（?tag= 筛选 + ?page= 分页）
 * SSR + unstable_cache，见 rendering-strategy.md
 */
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  // 有 tag 筛选时不分页（标签文章量小）；无 tag 时分页
  const { items: posts, totalPages } = tag
    ? { items: await getPostsByTag(tag), totalPages: 1 }
    : await getPostsPage(page, PAGE_SIZE);

  // 全部标签用于筛选栏
  const allPosts = await getPublishedPosts();
  const tags = [...new Set(allPosts.flatMap((p) => p.tags))].sort();

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 md:px-8 md:py-20">
      <FadeIn>
        <h1 className="mb-8 text-xs font-medium tracking-[0.25em] text-muted uppercase">
          {tag ? `标签：${tag}` : "全部文章"}
        </h1>
      </FadeIn>

      {/* 标签筛选栏 */}
      {tags.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="mb-12 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`border px-3 py-1 text-xs transition-colors ${
                !tag
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              全部
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className={`border px-3 py-1 text-xs transition-colors ${
                  tag === t
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </FadeIn>
      )}

      {posts.length === 0 ? (
        <FadeIn>
          <p className="text-sm leading-6 text-muted">
            {tag ? `没有「${tag}」标签的文章。` : "还没有文章。正在写作中，敬请期待。"}
          </p>
        </FadeIn>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {posts.map((post, i) => (
              <li key={post.slug} className="py-8 first:pt-0 last:pb-0">
                <FadeIn delay={(i % 5) * 0.06}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block transition-transform duration-300 hover:translate-x-1"
                  >
                    <div className="flex items-baseline gap-3">
                      <time className="shrink-0 text-xs text-muted">
                        {formatDate(post.publishedAt)}
                      </time>
                      {post.tags.length > 0 && (
                        <span className="truncate text-xs text-muted">
                          {post.tags.join(" · ")}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold leading-snug transition-colors group-hover:text-muted">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-muted">{post.excerpt}</p>
                  </Link>
                </FadeIn>
              </li>
            ))}
          </ul>

          {/* 分页 */}
          {totalPages > 1 && (
            <nav aria-label="分页" className="mt-14 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={tag ? `/blog?tag=${encodeURIComponent(tag)}&page=${page - 1}` : `/blog?page=${page - 1}`}
                  className="border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  上一页
                </Link>
              )}
              {pageNumbers.map((p) => (
                <Link
                  key={p}
                  href={tag ? `/blog?tag=${encodeURIComponent(tag)}&page=${p}` : `/blog?page=${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={`border px-3 py-1 text-xs transition-colors ${
                    p === page
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={tag ? `/blog?tag=${encodeURIComponent(tag)}&page=${page + 1}` : `/blog?page=${page + 1}`}
                  className="border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  下一页
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
