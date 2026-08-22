import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAdjacentPosts, getRelatedPosts } from "@/lib/posts";
import { getApprovedComments } from "@/lib/comments";
import { formatDate, readingTime } from "@/lib/format";
import { extractHeadings } from "@/lib/toc";
import { mdxComponents } from "@/lib/mdx-components";
import { mdxOptions } from "@/lib/mdx-options";
import { CommentForm } from "@/components/comment-form";
import { FadeIn } from "@/components/motion/fade-in";
import { MermaidRenderer } from "@/components/mermaid";
import "katex/dist/katex.min.css";

/**
 * /blog/[slug] 文章详情
 * - MDX：代码高亮（shiki 黑白灰）+ Callout + 图片放大 + TOC（rehype-slug）
 * - 前后篇导航 + 相关文章（同标签）
 * - 评论（不缓存；v0.7.0 起无审核流，提交即显示）
 */
export const dynamic = "force-dynamic";

/** 解码动态路由参数（中文 slug 在 App Router 中可能保留 URL 编码，v0.19.4） */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  // App Router 的动态路由参数对非 ASCII（中文）slug 可能保留 URL 编码（v0.19.4 修复 404）——
  // 统一解码；已解码时 decodeURIComponent 无副作用
  const slug = decodeSlug(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [comments, { prev, next }, related] = await Promise.all([
    getApprovedComments(post.id),
    getAdjacentPosts(post.slug, post.publishedAt),
    getRelatedPosts(post.slug, post.tags),
  ]);

  const toc = extractHeadings(post.content);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:px-8 md:py-20">
      <Link href="/blog" className="text-xs text-muted transition-colors hover:text-ink">
        ← 全部文章
      </Link>

      <FadeIn>
        <article className="mt-10 flex gap-14">
          {/* 结构化数据：Article JSON-LD（SEO，见 robots.ts / roadmap） */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                description: post.excerpt,
                datePublished: post.publishedAt,
                keywords: post.tags.join(", "),
                url: `${process.env.SITE_URL ?? "http://localhost:3000"}/blog/${post.slug}`,
                author: { "@type": "Person", name: "ReZenKi" },
              }),
            }}
          />
          {/* 正文区 */}
          <div className="min-w-0 flex-1">
            <header className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{post.title}</h1>
              <div className="mt-4 flex items-baseline gap-3 text-xs text-muted">
                <time>{formatDate(post.publishedAt)}</time>
                <span>·</span>
                <span>{readingTime(post.content)} 分钟阅读</span>
                <span>·</span>
                <span>{post.content.length} 字</span>
              </div>
              {post.tags.length > 0 && (
                <div className="mt-5 flex gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            {/* Markdown 正文：代码高亮 + Callout + 图片放大 + LaTeX + Mermaid（黑白灰，见 visual-style-guide.md） */}
            <div className="prose prose-neutral mx-auto mt-10 max-w-3xl dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:underline">
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{ mdxOptions }}
              />
            </div>
          </div>

          {/* TOC 侧栏（桌面端，≥2 个标题才显示） */}
          {toc.length >= 2 && (
            <aside className="hidden w-60 shrink-0 lg:block" aria-label="文章目录">
              <nav className="sticky top-24 border-l border-line pl-5">
                <h2 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">目录</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                      <a
                        href={`#${item.id}`}
                        className="text-muted transition-colors hover:text-ink"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </article>
      </FadeIn>

      {/* 上一篇/下一篇 */}
      {(prev || next) && (
        <FadeIn delay={0.1}>
          <nav
            aria-label="上一篇/下一篇"
            className="mx-auto mt-14 flex max-w-3xl justify-between gap-6 border-t border-line pt-6 text-sm"
          >
            {next ? (
              <Link href={`/blog/${next.slug}`} className="group max-w-[45%]">
                <span className="block text-xs text-muted">← 下一篇</span>
                <span className="mt-1 block font-medium transition-colors group-hover:text-muted">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="group max-w-[45%] text-right">
                <span className="block text-xs text-muted">上一篇 →</span>
                <span className="mt-1 block font-medium transition-colors group-hover:text-muted">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </FadeIn>
      )}

      {/* 相关文章（同标签） */}
      {related.length > 0 && (
        <FadeIn delay={0.15}>
          <section className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">相关文章</h2>
            <ul className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <time className="text-xs text-muted">{formatDate(p.publishedAt)}</time>
                    <h3 className="mt-1 text-lg font-semibold leading-snug transition-colors group-hover:text-muted">
                      {p.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      )}

      {/* 评论区 */}
      <FadeIn delay={0.2}>
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">
            评论（{comments.length}）
          </h2>{" "}
          {comments.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {comments.map((comment) => (
                <li key={comment.id} className="py-4">
                  <div className="flex items-baseline gap-3 text-xs text-muted">
                    <span className="font-medium text-ink">{comment.authorName}</span>
                    <time>{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-sm leading-6">{comment.content}</p>
                </li>
              ))}
            </ul>
          )}
          <CommentForm postId={post.id} />
        </section>
      </FadeIn>

      {/* Mermaid 图表渲染（client 扫描 mermaid 代码块） */}
      <MermaidRenderer />
    </main>
  );
}
