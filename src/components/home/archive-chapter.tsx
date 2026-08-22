"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { subscribeHomeScroll, getHomeScroll, getCarouselPages } from "@/components/home/scroll-source";

/**
 * Ch.02 档案 —— 按年份分组的时间轴（最多展示 6 篇，v0.21.4）
 * 档案元数据即排版元素：年代大字 + 小字宽字距（Getty 取舍逻辑）
 * 数据：全部已发布文章（由 page.tsx 经 getPublishedPosts 传入，自带缓存）
 *
 * 滚动驱动动效（v0.21.0，wheel 平滑翻页 2s 提供时长）：
 * - 入场：帖子从右往左滑入（x 48→0 + 淡入，stagger），章题/年份头纯淡入
 * - 退场：帖子原路返回（向右滑出 x 0→48，倒序），其他元素纯淡出
 * - 局部背景：书房书架蚀刻（Wellcome PDM，multiply 水印式底纹）
 * - R4 纪律：滚动驱动值一律 useMotionValue + effect 同步源，纯函数映射跟手零滞后
 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** 档案章展示上限（用户要求最多 6 篇） */
const ARCHIVE_LIMIT = 6;

export function ArchiveChapter({
  posts,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
    coverImage?: string | null;
  }[];
}) {
  const reduceMotion = useReducedMotion() ?? false;

  // 档案页全局页号 = 1（Hero） + 卡片页数（动态，见 scroll-source.setCarouselPages）；
  // enter 页顶入容器底→停靠，exit 页顶滚出→落款停靠
  // （2026-08-21 修 bug：原硬编码 4 卡——生产 1 篇时公式错位，档案章恒不可见）
  useSyncExternalStore(
    subscribeHomeScroll,
    () => {
      const { scrollTop, viewportH } = getHomeScroll();
      return `${scrollTop}:${viewportH}`;
    },
    () => "0:0",
  );
  const { scrollTop, viewportH } = getHomeScroll();
  const vh = viewportH || 1;
  const pages = getCarouselPages();
  const enter = clamp01(scrollTop / vh - pages);
  const exit = clamp01(scrollTop / vh - (pages + 1));

  const enterMV = useMotionValue(enter);
  const exitMV = useMotionValue(exit);
  useEffect(() => {
    enterMV.set(enter);
    exitMV.set(exit);
  });

  // 按年分组（publishedAt 可能来自 unstable_cache 序列化 → string，统一 new Date()）
  // 上限 6 篇（用户要求，按发布时间倒序取前 6）
  const limited = posts.slice(0, ARCHIVE_LIMIT);
  const byYear = new Map<number, typeof posts>();
  for (const post of limited) {
    if (!post.publishedAt) continue;
    const year = new Date(post.publishedAt).getFullYear();
    const list = byYear.get(year) ?? [];
    list.push(post);
    byYear.set(year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <>
      {/* 局部背景（水印式底纹：multiply 融入纸面，dark 反转） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/archive/bg-archive.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-[0.07] mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      <div
        data-archive-stage
        className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20"
      >
        <FadeBlock enter={enterMV} exit={exitMV} start={0} width={0.25}>
          {/* 章题 */}
          <p className="text-xs tracking-[0.35em] text-muted uppercase">Archive</p>
          <h2 className="mt-3 text-4xl font-medium leading-tight md:text-5xl">档案</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted">
            按年份归档的全部文章——写作是克制，展示也是。
          </p>
        </FadeBlock>

        {years.length === 0 ? (
          <p className="mt-12 text-sm leading-6 text-muted">还没有文章。</p>
        ) : (
          <div className="mt-14 space-y-14">
            {years.map((year) => {
              const yearPosts = byYear.get(year)!;
              return (
                <section key={year} className="grid gap-6 md:grid-cols-[8rem_1fr]">
                  <FadeBlock
                    enter={enterMV}
                    exit={exitMV}
                    start={0.2}
                    width={0.25}
                    className="flex items-baseline gap-3 md:flex-col md:gap-1"
                  >
                    {/* 年代大字（档案感：像图录的年份页眉） */}
                    <span className="text-6xl font-medium leading-none text-line md:text-7xl">
                      {year}
                    </span>
                    <span className="text-xs tracking-[0.35em] text-muted uppercase">
                      {yearPosts.length} 篇
                    </span>
                  </FadeBlock>

                  <ul className="divide-y divide-line border-t border-line">
                    {yearPosts.map((post, i) => (
                      <li key={post.slug}>
                        <PostRow
                          enter={enterMV}
                          exit={exitMV}
                          index={i}
                          count={yearPosts.length}
                          reduceMotion={reduceMotion}
                        >
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
                        </PostRow>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/** 纯淡入淡出的元素（章题/年份头）：进入 smoothstep 淡入，退场随 exit 淡出 */
function FadeBlock({
  enter,
  exit,
  start,
  width,
  className = "",
  children,
}: {
  enter: MotionValue<number>;
  exit: MotionValue<number>;
  start: number;
  width: number;
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform([enter, exit], ([a, b]: number[]) => {
    const tIn = smoothstep(clamp01((a - start) / width));
    return Math.min(tIn, 1 - b);
  });
  return (
    <motion.div style={{ opacity }} className={className}>
      {children}
    </motion.div>
  );
}

/** 帖子行：从右往左进入（x 48→0），退场原路返回（x 0→48，倒序），进出均淡入淡出 */
function PostRow({
  enter,
  exit,
  index,
  count,
  reduceMotion,
  children,
}: {
  enter: MotionValue<number>;
  exit: MotionValue<number>;
  index: number;
  count: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const startIn = 0.3 + index * 0.12; // 进入错峰（首项 0.3，末项 0.78）
  const startOut = (count - 1 - index) * 0.08; // 返回倒序（末项先出）

  const x = useTransform([enter, exit], ([a, b]: number[]) => {
    const tIn = smoothstep(clamp01((a - startIn) / 0.22));
    const tOut = smoothstep(clamp01((b - startOut) / 0.5));
    return reduceMotion ? 0 : 48 * (1 - tIn + tOut);
  });
  const opacity = useTransform([enter, exit], ([a, b]: number[]) => {
    const tIn = smoothstep(clamp01((a - startIn) / 0.22));
    const tOut = smoothstep(clamp01((b - startOut) / 0.5));
    return Math.min(tIn, 1 - tOut);
  });

  return (
    <motion.div data-archive-post style={{ x, opacity }}>
      {children}
    </motion.div>
  );
}
