"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { PostCard, CardInfo } from "@/components/home/post-card";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * Ch.01 最近：滚动逐卡翻页
 * - 每张卡片占一屏（snap-start）——吸附无中间态
 * - 进出场 45°：滚出斜向左上 45°，进入从右下 45°（x/y 等量）
 * - 卡片 16:9 纯图；文章信息在屏幕左下角，滑动渐进渐出
 * - v0.21.0 重构（修 D3/D4）：滚动进度由共享滚动源纯数学推导
 *   （page = hero 1 页 + 卡片序号），零 per-card listener、零强制重排；
 *   reduced-motion 下关闭位移/旋转转场，仅保留淡入（JS matchMedia，CSS 降级无效）
 */

/** Ch.00 Hero 恒占一页，卡片页从全局第 1 页起算 */
const HERO_PAGES = 1;

export function SceneCarousel({
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
  const items = posts.slice(0, 4);

  return (
    <div className="relative w-full">
      {items.map((post, i) => (
        <CardSlide key={post.slug} post={post} index={i} total={items.length} />
      ))}
    </div>
  );
}

function CardSlide({
  post,
  index,
  total,
}: {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
  };
  index: number;
  total: number;
}) {
  const reduceMotion = useReducedMotion();

  // 订阅共享滚动源（HomeScenes 的唯一 rAF listener 写入；此处零重排读取）
  useSyncExternalStore(
    subscribeHomeScroll,
    () => {
      const { scrollTop, viewportH } = getHomeScroll();
      return `${scrollTop}:${viewportH}`;
    },
    () => "0:0", // SSR server snapshot：服务端无滚动，恒定 0
  );

  // 纯数学推导（snap 布局每页等高）：
  // 卡片 i 的全局页 = HERO_PAGES + i；elTop = (HERO_PAGES+i)*vh - scrollTop
  // enter: 页顶从视口底进入 → 停到视口顶；exit: 页顶从视口顶滚出上方一屏
  const { scrollTop, viewportH } = getHomeScroll();
  const vh = viewportH || 1;
  const globalPage = HERO_PAGES + index;
  const enter = Math.min(1, Math.max(0, scrollTop / vh - index));
  const exit = Math.min(1, Math.max(0, scrollTop / vh - globalPage));

  // 45° 进出场（x/y 等量，对称）：滚出向左上 45° -920px/-10°；
  // 进入从右下 45° +920px/+10° 滑入（2026-08-20 用户要求：入场幅度与出场相当，
  // 原 75px 太小 → 对称 920px）
  // reduce 模式：无位移/旋转，仅 opacity（修 D4）
  // 修 R4（v0.21.0）：滚动驱动值一律 useMotionValue + effect 同步源
  // 去 spring（v0.21.0 补丁）：55/19 弹簧在 snap 过渡中滞后于滚动 → 顿挫；
  // 改纯函数缓动（easeOutCubic/smoothstep），一帧内计算、与滚动 1:1 跟手
  const enterMV = useMotionValue(enter);
  const exitMV = useMotionValue(exit);
  useEffect(() => {
    enterMV.set(enter);
    exitMV.set(exit);
  });
  const enterEased = useTransform(enterMV, (t) => 1 - Math.pow(1 - t, 3));
  const exitEased = useTransform(exitMV, (t) => t * t * (3 - 2 * t));

  const enterX = useTransform(enterEased, [0, 1], reduceMotion ? [0, 0] : [920, 0]);
  const enterY = useTransform(enterEased, [0, 1], reduceMotion ? [0, 0] : [920, 0]);
  const enterRotate = useTransform(enterEased, [0, 1], reduceMotion ? [0, 0] : [10, 0]);
  const enterOpacity = useTransform(enterEased, [0, 0.6], [0, 1]);
  const exitX = useTransform(exitEased, [0.25, 1], reduceMotion ? [0, 0] : [0, -920]);
  const exitY = useTransform(exitEased, [0.25, 1], reduceMotion ? [0, 0] : [0, -920]);
  const exitRotate = useTransform(exitEased, [0.25, 1], reduceMotion ? [0, 0] : [0, -10]);
  const exitOpacity = useTransform(exitEased, [0.25, 1], [1, 0]);

  // 有源组合（修 R4：无源 () => a.get()+b.get() 不响应源变化）
  const x = useTransform([enterX, exitX], ([a, b]: number[]) => a + b);
  const y = useTransform([enterY, exitY], ([a, b]: number[]) => a + b);
  const rotate = useTransform([enterRotate, exitRotate], ([a, b]: number[]) => a + b);
  const opacity = useTransform([enterOpacity, exitOpacity], ([a, b]: number[]) =>
    Math.min(a, b),
  );
  // 信息渐进渐出进度
  const infoProgress = opacity;

  return (
    <div className="relative flex h-[calc(100dvh-var(--header-h))] w-full snap-start items-center justify-center overflow-hidden px-6 md:px-8">
      {/* 16:9 图片卡 */}
      <motion.div
        style={{ x, y, rotate, opacity }}
        data-card-slide
        className="relative aspect-video w-[min(90vw,1080px)]"
      >
        <PostCard {...post} index={index} />
      </motion.div>

      {/* 左下角文章信息（渐进渐出） */}
      <CardInfo
        title={post.title}
        excerpt={post.excerpt}
        publishedAt={post.publishedAt}
        tags={post.tags}
        progress={infoProgress}
        slug={post.slug}
      />

      {/* 页签 */}
      <span className="absolute bottom-8 right-6 text-[11px] tracking-[0.3em] text-muted uppercase md:right-10">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
