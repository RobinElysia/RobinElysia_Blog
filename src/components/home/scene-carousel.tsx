"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
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

  // 45° 进出场（x/y 等量）：滚出绝对像素 -920，进入 75（v0.17.0 参数保留）
  // reduce 模式：无位移/旋转，仅 opacity（修 D4）
  const enterSpring = useSpring(enter, { stiffness: 55, damping: 19 });
  const exitSpring = useSpring(exit, { stiffness: 55, damping: 19 });

  const enterX = useTransform(enterSpring, [0, 1], reduceMotion ? [0, 0] : [75, 0]);
  const enterY = useTransform(enterSpring, [0, 1], reduceMotion ? [0, 0] : [75, 0]);
  const enterOpacity = useTransform(enterSpring, [0, 0.6], [0, 1]);
  const exitX = useTransform(exitSpring, [0.25, 1], reduceMotion ? [0, 0] : [0, -920]);
  const exitY = useTransform(exitSpring, [0.25, 1], reduceMotion ? [0, 0] : [0, -920]);
  const exitRotate = useTransform(exitSpring, [0.25, 1], reduceMotion ? [0, 0] : [0, -10]);
  const exitOpacity = useTransform(exitSpring, [0.25, 1], [1, 0]);

  const x = useTransform(() => enterX.get() + exitX.get());
  const y = useTransform(() => enterY.get() + exitY.get());
  const opacity = useTransform((): number => Math.min(enterOpacity.get(), exitOpacity.get()));
  // 信息渐进渐出进度
  const infoProgress = useTransform((): number =>
    Math.min(enterOpacity.get(), exitOpacity.get()),
  );

  return (
    <div className="relative flex h-[calc(100dvh-var(--header-h))] w-full snap-start items-center justify-center overflow-hidden px-6 md:px-8">
      {/* 16:9 图片卡 */}
      <motion.div
        style={{ x, y, rotate: exitRotate, opacity }}
        className="aspect-video w-[min(90vw,1080px)]"
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
