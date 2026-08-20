"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * Ch.02 档案 —— 按年份分组的时间轴
 * 档案元数据即排版元素：年代大字 + 小字宽字距（Getty 取舍逻辑）
 * 数据：全部已发布文章（由 page.tsx 经 getPublishedPosts 传入，自带缓存）
 *
 * 滚动驱动动效（v0.21.0）：
 * - 入场：章题 → 年份头 → 文章，依次从左向右滑入（x -40→0 + 淡入，stagger 0.08）
 * - 退场：滚向落款时整章内容向视口中心收缩（scale 1→0.85）+ 淡出
 * - R4 纪律：滚动驱动值一律 useMotionValue + effect 同步源，spring/transform 订阅 MotionValue
 */
export function ArchiveChapter({
  posts,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
  }[];
}) {
  const reduceMotion = useReducedMotion() ?? false;

  // 档案页全局页号 = 5（Hero 1 + 4 卡）；enter 页顶入容器底→停靠，exit 页顶滚出→落款停靠
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
  const enter = Math.min(1, Math.max(0, scrollTop / vh - 4));
  const exit = Math.min(1, Math.max(0, scrollTop / vh - 5));

  const enterMV = useMotionValue(enter);
  const exitMV = useMotionValue(exit);
  useEffect(() => {
    enterMV.set(enter);
    exitMV.set(exit);
  });

  // 退场收缩：面向视口中心（章内容块居中，origin 50% 45% ≈ 屏幕中心偏上）
  const stageScale = useTransform(exitMV, [0, 1], reduceMotion ? [1, 1] : [1, 0.85]);
  const stageOpacity = useTransform(exitMV, [0, 1], [1, 0]);

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

  // 章题占 reveal 序号 0；年份头与文章依次递增（单次 render 内顺序确定）
  let revealIndex = 1;

  return (
    <motion.div
      data-archive-stage
      style={{ scale: stageScale, opacity: stageOpacity, transformOrigin: "50% 45%" }}
      className="mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20"
    >
      <RevealItem enter={enterMV} index={0} reduceMotion={reduceMotion}>
        {/* 章题 */}
        <p className="text-xs tracking-[0.35em] text-muted uppercase">Archive</p>
        <h2 className="mt-3 text-4xl font-medium leading-tight md:text-5xl">档案</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted">
          按年份归档的全部文章——写作是克制的禅意，展示也是。
        </p>
      </RevealItem>

      {years.length === 0 ? (
        <p className="mt-12 text-sm leading-6 text-muted">还没有文章。</p>
      ) : (
        <div className="mt-14 space-y-14">
          {years.map((year) => (
            <section key={year} className="grid gap-6 md:grid-cols-[8rem_1fr]">
              <RevealItem
                enter={enterMV}
                index={revealIndex++}
                reduceMotion={reduceMotion}
                className="flex items-baseline gap-3 md:flex-col md:gap-1"
              >
                {/* 年代大字（档案感：像图录的年份页眉） */}
                <span className="text-6xl font-medium leading-none text-line md:text-7xl">
                  {year}
                </span>
                <span className="text-xs tracking-[0.35em] text-muted uppercase">
                  {byYear.get(year)!.length} 篇
                </span>
              </RevealItem>

              <ul className="divide-y divide-line border-t border-line">
                {byYear.get(year)!.map((post) => (
                  <li key={post.slug}>
                    <RevealItem
                      enter={enterMV}
                      index={revealIndex++}
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
                    </RevealItem>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** 滚动驱动逐项入场：从左滑入（x -40→0）+ 淡入；index 决定 stagger 顺序 */
function RevealItem({
  enter,
  index,
  reduceMotion,
  className = "",
  children,
}: {
  enter: MotionValue<number>;
  index: number;
  reduceMotion: boolean;
  className?: string;
  children: ReactNode;
}) {
  // 每项窗口：起点 0.18 + index*0.08，宽度 0.24（末项 0.66+0.24=0.9 < 1 全数到位）
  const start = 0.18 + index * 0.08;
  const t = useTransform(enter, [start, Math.min(1, start + 0.24)], [0, 1], {
    clamp: true,
  });
  const x = useTransform(t, [0, 1], reduceMotion ? [0, 0] : [-40, 0]);
  const opacity = t;

  return (
    <motion.div style={{ x, opacity }} className={className}>
      {children}
    </motion.div>
  );
}
