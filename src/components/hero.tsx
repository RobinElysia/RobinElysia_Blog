import { HeroContent } from "@/components/hero-content";

/**
 * 首页第一页 —— 档案图视差舞台（v0.21.3，替换 3D 水波纹）
 * - 全屏固定舞台：背景装饰 / 主艺术图（伊甸园蚀刻）/ 前景标题 / 底部滚动提示
 * - 鼠标跟随惯性视差：各层不同强度（见 hero-content.tsx）
 * - 标题两行 overflow-hidden 入场（无弹跳）；滚动离开时整台渐出上移
 * - 一屏一页（h-full + snap-start，PPT 式）
 */
export function Hero() {
  return (
    <header className="relative flex h-full min-h-[560px] w-full items-center justify-center overflow-hidden border-b border-line">
      <HeroContent />

      {/* 底部渐变过渡到正文 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-b from-transparent to-paper" />
    </header>
  );
}
