"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Hero 文字层：滚动离开 Hero 时文字渐出上移（过渡到卡片页）
 * 逐字错峰入场保留（首屏 CSS 动画由 globals.css 提供）
 */
export function HeroContent() {
  const ref = useRef<HTMLDivElement>(null);
  // 滚出进度（Hero 顶部离开视口）
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "start -0.5"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const letters = "ReZenKi".split("");

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className="relative z-10 px-6 text-center"
    >
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
