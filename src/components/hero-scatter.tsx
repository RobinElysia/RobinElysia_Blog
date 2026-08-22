"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";

/**
 * Hero 散落图集（v0.21.3，用户要求"开屏多图分布"）
 * - 6 张 Wellcome 蚀刻像收藏品散落在第一页各处（固定位置、大小不一、轻微旋转）
 * - 首屏可见 4 张；向下滚动（Hero 滚出进度）再浮现 2 张，直到进入「最近」章
 * - 整层随背景强度视差（±8/6）；reveal 项滚动驱动淡入 + 微上移
 * - 布局数据静态集中于此（% 定位，桌面优先；小屏隐藏中位两张）
 */
const SCATTER = [
  { src: "/archive/scatter-2.jpg", cls: "left-[4%] top-[12%] w-36 md:w-44", rotate: -5, reveal: 0 },
  { src: "/archive/scatter-4.jpg", cls: "right-[6%] top-[9%] w-40 md:w-48", rotate: 4, reveal: 0 },
  {
    src: "/archive/scatter-1.jpg",
    cls: "left-[2%] top-[40%] w-28 md:w-32",
    rotate: 2,
    reveal: 0,
    mobile: false,
  },
  {
    src: "/archive/scatter-6.jpg",
    cls: "right-[3%] top-[34%] w-32 md:w-40",
    rotate: -6,
    reveal: 0,
    mobile: false,
  },
  {
    src: "/archive/scatter-3.jpg",
    cls: "left-[7%] bottom-[16%] w-28 md:w-36",
    rotate: 3,
    reveal: 0.22,
  },
  {
    src: "/archive/scatter-5.jpg",
    cls: "right-[8%] bottom-[14%] w-36 md:w-44",
    rotate: -3,
    reveal: 0.34,
  },
] as const;

export function HeroScatter({
  px,
  py,
  exit,
  reduceMotion,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  exit: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // 整层随背景强度视差（±8/6）
  const x = useTransform(px, (v): number => (reduceMotion ? 0 : v * 8));
  const y = useTransform(py, (v): number => (reduceMotion ? 0 : v * 6));

  return (
    <motion.div aria-hidden style={{ x, y }} className="absolute inset-0 z-[5]">
      {SCATTER.map((s) => (
        <ScatterItem key={s.src} {...s} exit={exit} reduceMotion={reduceMotion} />
      ))}
    </motion.div>
  );
}

function ScatterItem({
  src,
  cls,
  rotate,
  reveal,
  exit,
  reduceMotion,
  mobile = true,
}: {
  src: string;
  cls: string;
  rotate: number;
  reveal: number;
  exit: MotionValue<number>;
  reduceMotion: boolean;
  mobile?: boolean;
}) {
  // reveal=0：首屏固定可见（CSS hero-scatter-in 入场淡入）
  // reveal>0：滚动驱动浮现（Hero 滚出进度 0→1 的错峰窗口）
  // hooks 无条件调用（rules-of-hooks）——reveal=0 时 t/y 随滚动变化但未被引用，无害
  const t = useTransform(exit, [reveal, Math.min(1, reveal + 0.3)], [0, 1], { clamp: true });
  const y = useTransform(t, [0, 1], reduceMotion ? [0, 0] : [14, 0]);
  const opacity = reveal === 0 ? undefined : t;
  const yStyle = reveal === 0 ? undefined : y;

  return (
    <motion.div
      style={{ opacity, y: yStyle, rotate }}
      data-hero-scatter
      className={`absolute ${cls} ${mobile ? "" : "hidden md:block"} ${reveal === 0 ? "hero-scatter-in" : ""}`}
    >
      {/* 纸片式小卡（保留原图白底，像图录里的散落藏品） */}
      <div className="border border-line bg-paper/70 p-1 shadow-sm">
        <div className="relative aspect-[4/3] w-full">
          <Image src={src} alt="" fill sizes="220px" className="object-cover" />
        </div>
      </div>
    </motion.div>
  );
}
