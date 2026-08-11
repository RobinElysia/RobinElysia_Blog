"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { PostCard, CardInfo } from "@/components/home/post-card";

/**
 * Scene 2：滚动逐卡翻页（v0.15.0）
 * - 每张卡片占一屏（snap-start）——吸附无中间态
 * - 进出场 45°：滚出斜向左上 45°，进入从右下 45°（x/y 等量）
 * - 卡片 16:9 纯图；文章信息在屏幕左下角，滑动渐进渐出
 * - 滚动进度：手动监听局部滚动容器（motion useScroll 在局部容器不可靠，v0.15.0 踩坑）
 */
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
  const ref = useRef<HTMLDivElement>(null);

  // 滚动进度（手动驱动）：0 = 卡片页完全在容器视口内，±1 = 滚入/滚出
  const enter = useMotionValue(0); // 进入进度：页顶从视口底 → 视口顶
  const exit = useMotionValue(0); // 滚出进度：页顶从视口顶 → 上方一屏

  useEffect(() => {
    const scroller = document.querySelector("[data-scroll-container]");
    const el = ref.current;
    if (!scroller || !el) return;

    const update = () => {
      const containerRect = scroller.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const vh = containerRect.height || 1;
      // 元素顶相对容器视口顶（0 = 视口顶，vh = 视口底）
      const elTop = rect.top - containerRect.top;
      // 进入：elTop 从 vh → 0（视口底进入 → 停到视口顶）
      enter.set(Math.min(1, Math.max(0, 1 - elTop / vh)));
      // 滚出：elTop 从 0 → -vh（滚出上方一屏）
      exit.set(Math.min(1, Math.max(0, -elTop / vh)));
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enter, exit]);

  // 45° 进出场：x/y 等量；滚出绝对像素（幅度加大 v0.17.0：滚出 -920 / 进入 75）
  // spring 平滑：snap 吸附快，但转场动画慢速播放（进度追赶 ~600ms）
  const enterSpring = useSpring(enter, { stiffness: 55, damping: 19 });
  const exitSpring = useSpring(exit, { stiffness: 55, damping: 19 });

  const enterX = useTransform(enterSpring, [0, 1], [75, 0]);
  const enterY = useTransform(enterSpring, [0, 1], [75, 0]);
  const enterOpacity = useTransform(enterSpring, [0, 0.6], [0, 1]);
  const exitX = useTransform(exitSpring, [0.25, 1], [0, -920]);
  const exitY = useTransform(exitSpring, [0.25, 1], [0, -920]);
  const exitRotate = useTransform(exitSpring, [0.25, 1], [0, -10]);
  const exitOpacity = useTransform(exitSpring, [0.25, 1], [1, 0]);

  const x = useTransform(() => enterX.get() + exitX.get());
  const y = useTransform(() => enterY.get() + exitY.get());
  const opacity = useTransform(
    (): number => Math.min(enterOpacity.get(), exitOpacity.get()),
  );
  // 信息渐进渐出进度
  const infoProgress = useTransform(
    (): number => Math.min(enterOpacity.get(), exitOpacity.get()),
  );

  return (
    <div
      ref={ref}
      className="relative flex h-[calc(100dvh-57px)] w-full snap-start items-center justify-center overflow-hidden px-6 md:px-8"
    >
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
      />

      {/* 页签 */}
      <span className="absolute bottom-8 right-6 text-[11px] tracking-[0.3em] text-muted uppercase md:right-10">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
