"use client";

import Link from "next/link";
import { motion } from "motion/react";

/**
 * Ch.02 档案 —— 按年份分组的时间轴
 * 档案元数据即排版元素：年代大字 + 小字宽字距（Getty 取舍逻辑）
 * 数据：全部已发布文章（由 page.tsx 经 getPublishedPosts 传入，自带缓存）
 */
export function ArchiveChapter({
  posts,
  current = false,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
  }[];
  current?: boolean;
}) {
  // 按年分组（publishedAt 可能来自 unstable_cache 序列化 → string，统一 new Date()）
  const byYear = new Map<number, typeof posts>();
  for (const post of posts) {
    if (!post.publishedAt) continue;
    const year = new Date(post.publishedAt).getFullYear();
    const list = byYear.get(year) ?? [];
    list.push(post);
    byYear.set(year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20">
      <motion.div
        initial={{ opacity: current ? 1 : 0.6, y: current ? 0 : 8 }}
        animate={{ opacity: current ? 1 : 0.6, y: current ? 0 : 8 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 章题 */}
        <p className="text-xs tracking-[0.35em] text-muted uppercase">Archive</p>
        <h2 className="mt-3 text-4xl font-medium leading-tight md:text-5xl">档案</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted">
          按年份归档的全部文章——写作是克制的禅意，展示也是。
        </p>
      </motion.div>

      {years.length === 0 ? (
        <p className="mt-12 text-sm leading-6 text-muted">还没有文章。</p>
      ) : (
        <div className="mt-14 space-y-14">
          {years.map((year) => (
            <section key={year} className="grid gap-6 md:grid-cols-[8rem_1fr]">
              {/* 年代大字（档案感：像图录的年份页眉） */}
              <div className="flex items-baseline gap-3 md:flex-col md:gap-1">
                <span className="text-6xl font-medium leading-none text-line md:text-7xl">
                  {year}
                </span>
                <span className="text-xs tracking-[0.35em] text-muted uppercase">
                  {byYear.get(year)!.length} 篇
                </span>
              </div>

              <ul className="divide-y divide-line border-t border-line">
                {byYear.get(year)!.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex items-baseline gap-6 py-4"
                    >
                      <time className="shrink-0 text-xs tracking-[0.2em] text-muted">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("zh-CN", {
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : ""}
                      </time>
                      <span className="min-w-0 flex-1 truncate text-base transition-colors group-hover:text-muted">
                        {post.title}
                      </span>
                      <span className="hidden shrink-0 gap-2 sm:flex">
                        {post.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="border border-line px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
