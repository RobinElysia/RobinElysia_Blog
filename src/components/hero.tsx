import { WaveOcean } from "@/components/wave-ocean";
import { HeroContent } from "@/components/hero-content";

/**
 * 首页第一页 —— 3D 大气水波纹场景（v0.15.0）
 * - 背景：Three.js 3D 波浪水面（低角度透视 + 光影，鼠标划过冲击波）
 * - 文字：花体 "RobinElysia" 逐字错峰浮现 + 副标题（大字号，大气排版）
 * - 滚动离开时：文字随滚动进度渐出上移（过渡到卡片页更顺滑）
 * - 一屏一页（h-screen + snap-start，PPT 式）
 */
export function Hero() {
  return (
    <header className="relative flex h-full min-h-[560px] w-full items-center justify-center overflow-hidden border-b border-line">
      {/* 3D 波浪背景 */}
      <WaveOcean />

      {/* 文字层（滚动渐出，由 hero-content 处理） */}
      <HeroContent />

      {/* 底部渐变过渡到正文 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-b from-transparent to-paper" />
    </header>
  );
}
