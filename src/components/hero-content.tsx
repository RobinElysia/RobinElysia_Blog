"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * Hero 视差舞台（v0.21.3，替换 3D 水波纹——用户否决 Three.js 方案）
 * - 鼠标跟随惯性视差：normalized -1..1 + lerp 0.06，四层强度
 *   背景装饰 ±8/6 · 主图 ±18/12（+rotateY±1.5° rotateX±1°）· 主图内层反向
 *   ±6/4（景深）· 前景标题 ±28/20；鼠标离开平滑回中心
 * - rAF 循环收敛即停（R5 纪律：无谓循环烧 CPU）
 * - 标题两行 overflow-hidden 入场（CSS hero-rise，无弹跳，行间 0.12s）
 * - 滚动离开第 0 页：整台随共享滚动源渐出上移（衔接逐卡翻页）
 */
export function HeroContent() {
  const reduceMotion = useReducedMotion() ?? false;

  // ---- 滚出衔接（共享滚动源，第 0 页 exit = scrollTop/vh） ----
  useSyncExternalStore(
    subscribeHomeScroll,
    () => {
      const { scrollTop, viewportH } = getHomeScroll();
      return `${scrollTop}:${viewportH}`;
    },
    () => "0:0",
  );
  const { scrollTop, viewportH } = getHomeScroll();
  const exit = Math.min(1, Math.max(0, scrollTop / (viewportH || 1)));
  const exitMV = useMotionValue(exit);
  useEffect(() => {
    exitMV.set(exit);
  });
  const stageOpacity = useTransform(exitMV, [0, 0.6], [1, 0]);
  const stageY = useTransform(exitMV, [0, 1], reduceMotion ? [0, 0] : [0, -60]);

  // ---- 鼠标跟随惯性视差 ----
  const px = useMotionValue(0); // lerped normalizedX (-1..1)
  const py = useMotionValue(0);
  useEffect(() => {
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let running = false;
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      start();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      start();
    };
    const loop = () => {
      const cx = px.get();
      const cy = py.get();
      const nx = cx + (tx - cx) * 0.06;
      const ny = cy + (ty - cy) * 0.06;
      px.set(nx);
      py.set(ny);
      // 收敛（目标为 0 且已稳定）→ 停循环；鼠标移动/离开时由 start 重启
      if (tx === 0 && ty === 0 && Math.abs(tx - nx) < 0.0004 && Math.abs(ty - ny) < 0.0004) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [px, py]);

  // 层强度映射（reduce 下全部归零——仅入场/滚出保留）
  const bgX = useTransform(px, (v) => (reduceMotion ? 0 : v * 8));
  const bgY = useTransform(py, (v) => (reduceMotion ? 0 : v * 6));
  const imgX = useTransform(px, (v) => (reduceMotion ? 0 : v * 18));
  const imgY = useTransform(py, (v) => (reduceMotion ? 0 : v * 12));
  const imgRotY = useTransform(px, (v) => (reduceMotion ? 0 : v * 1.5));
  const imgRotX = useTransform(py, (v) => (reduceMotion ? 0 : v * -1));
  const imgInnerX = useTransform(px, (v) => (reduceMotion ? 0 : v * -6));
  const imgInnerY = useTransform(py, (v) => (reduceMotion ? 0 : v * -4));
  const fgX = useTransform(px, (v) => (reduceMotion ? 0 : v * 28));
  const fgY = useTransform(py, (v) => (reduceMotion ? 0 : v * 20));

  return (
    <motion.div
      style={{ opacity: stageOpacity, y: stageY }}
      className="relative z-10 flex h-full w-full items-center justify-center"
    >
      {/* 背景装饰层（z-0）：细网格 + 径向微光，视差 ±8/6 */}
      <motion.div
        aria-hidden
        style={{ x: bgX, y: bgY }}
        className="absolute inset-0 opacity-60"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
            opacity: 0.35,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 50% 46%, var(--color-ink) 0%, transparent 100%)",
            opacity: 0.05,
          }}
        />
      </motion.div>

      {/* 主图（z-10）：伊甸园蚀刻，multiply 融入纸面，视差 ±18/12 + 微旋转 */}
      <motion.div
        aria-hidden
        style={{ x: imgX, y: imgY, rotateX: imgRotX, rotateY: imgRotY }}
        className="hero-img-in absolute inset-0 flex items-center justify-center"
      >
        <motion.div style={{ x: imgInnerX, y: imgInnerY }} className="relative h-[68%] w-full">
          <Image
            src="/archive/hero-paradise.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-contain mix-blend-multiply opacity-90 dark:mix-blend-screen dark:opacity-40"
          />
        </motion.div>
      </motion.div>

      {/* 前景标题层（z-20）：视差 ±28/20 */}
      <motion.div
        style={{ x: fgX, y: fgY }}
        className="relative z-20 flex flex-col items-center px-6 text-center"
      >
        <h1
          className="font-serif text-[clamp(2.6rem,9.5vw,6.2rem)] font-medium leading-[1.05] tracking-tight"
          aria-label="RobinElysia"
        >
          <span className="hero-line">
            <span className="hero-line-inner">RobinElysia</span>
          </span>
        </h1>
        <p className="hero-line mt-5">
          <span className="hero-line-inner hero-line-delay block text-xs tracking-[0.42em] text-muted uppercase md:text-sm">
            Robin And Elysia
          </span>
        </p>
      </motion.div>

      {/* 前景细节层（z-30）：中文 slogan 小字，视差 ±28/20 */}
      <motion.div
        aria-hidden
        style={{ x: fgX, y: fgY }}
        className="hero-fade-in absolute z-30 hidden -translate-x-16 translate-y-10 text-[11px] tracking-[0.3em] text-muted sm:block md:left-[16%] md:top-[22%]"
      >
        划过水面 · 激起波澜
      </motion.div>

      {/* 底部滚动提示（z-30，固定不随视差移动） */}
      <div className="hero-fade-in absolute inset-x-0 bottom-8 z-30 flex flex-col items-center gap-3">
        <span className="text-[10px] tracking-[0.5em] text-muted uppercase">
          Scroll To Explore
        </span>
        <span aria-hidden className="h-10 w-px bg-ink/50" />
      </div>
    </motion.div>
  );
}
