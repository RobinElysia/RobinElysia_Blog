"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * Ch.03 落款 —— 签名式入场（滚动驱动，v0.21.0）
 * 书末页：花体签名像落笔一样从左侧滑入回正 → 墨线横向展开 → © 行 → 链接行依次浮现
 * 落款页全局页号 = 6；enter 页顶入容器底→停靠（scrollTop/vh - 5）
 * R4 纪律：滚动驱动值一律 useMotionValue + effect 同步源
 */
export function Colophon() {
  const reduceMotion = useReducedMotion() ?? false;

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
  const enter = Math.min(1, Math.max(0, scrollTop / vh - 5));

  const enterMV = useMotionValue(enter);
  useEffect(() => {
    enterMV.set(enter);
  });

  // 签名：先落笔（0→0.45），左下角滑入 + 微旋回正
  const tSig = useTransform(enterMV, [0, 0.45], [0, 1]);
  const sigX = useTransform(tSig, [0, 1], reduceMotion ? [0, 0] : [-28, 0]);
  const sigRotate = useTransform(tSig, [0, 1], reduceMotion ? [0, 0] : [-4, 0]);
  const sigOpacity = tSig;
  // 墨线：签名将成时从中间展开（0.35→0.75）
  const tLine = useTransform(enterMV, [0.35, 0.75], [0, 1]);
  const lineScaleX = useTransform(tLine, [0, 1], reduceMotion ? [1, 1] : [0, 1]);
  const lineOpacity = useTransform(tLine, [0, 0.3], [0, 1]);
  // 版权行（0.55→0.9）与链接行（0.7→1）依次浮现
  const tCopy = useTransform(enterMV, [0.55, 0.9], [0, 1]);
  const copyY = useTransform(tCopy, [0, 1], reduceMotion ? [0, 0] : [12, 0]);
  const tLinks = useTransform(enterMV, [0.7, 1], [0, 1]);

  return (
    <footer className="text-center" data-colophon>
      {/* 花体签名（视觉装饰，aria-hidden；e2e 标题断言不撞 h1） */}
      <motion.div
        style={{ x: sigX, rotate: sigRotate, opacity: sigOpacity }}
        className="relative z-10 px-6 text-center"
      >
        <span aria-hidden className="font-script text-7xl leading-none md:text-8xl">
          ReZenKi
        </span>
      </motion.div>

      {/* 签名墨线 */}
      <motion.div
        aria-hidden
        style={{ scaleX: lineScaleX, opacity: lineOpacity }}
        className="mx-auto mt-5 h-px w-56 bg-ink/60"
      />

      <motion.div style={{ y: copyY, opacity: tCopy }} className="mt-6">
        <p className="text-[11px] tracking-[0.3em] text-muted uppercase">
          © 2025 ReZenKi · RefrainZen And KiKi
        </p>
      </motion.div>

      <motion.div style={{ opacity: tLinks }} className="mt-2">
        <p className="text-[11px] tracking-[0.2em] text-muted uppercase">
          <Link href="/blog" className="transition-colors hover:text-ink">
            全部文章
          </Link>
          <span className="mx-2">·</span>
          <Link href="/about" className="transition-colors hover:text-ink">
            关于
          </Link>
          <span className="mx-2">·</span>
          <Link href="/feed.xml" className="transition-colors hover:text-ink">
            RSS
          </Link>
        </p>
      </motion.div>
    </footer>
  );
}
