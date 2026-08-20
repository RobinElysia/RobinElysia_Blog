"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * Hero 文字层：滚动离开 Hero（第 0 页）时文字渐出上移（过渡到卡片页）
 * v0.21.0：改用共享滚动源驱动（原 motion useScroll 监听 window，局部容器下不滚动，
 * 滚出动画从未生效——D8 类坑）；reduced-motion 下关闭位移只淡出。
 * 逐字错峰入场保留（首屏 CSS 动画由 globals.css 提供）。
 */
export function HeroContent() {
  const reduceMotion = useReducedMotion();

  useSyncExternalStore(subscribeHomeScroll, () => {
    const { scrollTop, viewportH } = getHomeScroll();
    return `${scrollTop}:${viewportH}`;
  });

  const { scrollTop, viewportH } = getHomeScroll();
  // 第 0 页滚出进度：0 = Hero 在视口内，1 = 完全滚出上方
  const exit = Math.min(1, Math.max(0, scrollTop / (viewportH || 1) - 1));
  const exitProgress = useTransform(() => exit);
  const opacity = useTransform(exitProgress, [0, 0.6], [1, 0]);
  const y = useTransform(exitProgress, [0, 1], reduceMotion ? [0, 0] : [0, -60]);

  const letters = "ReZenKi".split("");

  return (
    <motion.div style={{ opacity, y }} className="relative z-10 px-6 text-center">
      <h1 className="font-script text-8xl leading-none md:text-9xl" aria-label="ReZenKi">
        {letters.map((ch, i) => (
          <span
            key={i}
            className="inline-block animate-letter-in"
            style={{ "--i": i } as React.CSSProperties}
            aria-hidden="true"
          >
            {ch}
          </span>
        ))}
      </h1>
      <p
        className="mt-8 animate-fade-up text-sm tracking-[0.45em] text-muted uppercase md:text-base"
        style={{ animationDelay: "0.5s" }}
      >
        RefrainZen And KiKi
      </p>
      <p
        className="mt-4 animate-fade-up text-xs tracking-[0.3em] text-muted uppercase"
        style={{ animationDelay: "1.2s" }}
      >
        划过水面 · 激起波澜
      </p>
    </motion.div>
  );
}
