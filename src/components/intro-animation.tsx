"use client";

import { useLayoutEffect, useState } from "react";

/**
 * 站点首次加载进入动画（v0.21.0）
 * - 全屏 overlay（暖纸底）中央 SVG 手写描画 "ReZenKi"（Italianno 花体 stroke 描画 → fill 渐入）
 * - 同会话只播一次（sessionStorage）；prefers-reduced-motion 直接跳过
 * - 挂载于根 layout，全站入口首帧播放
 */
export function IntroAnimation() {
  // phase: playing → fade → done；skip = 本次会话已播过或 reduce 偏好
  const [phase, setPhase] = useState<"playing" | "fade" | "done">("playing");

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("intro-played")) {
      // 异步移除（避免 effect 内同步 setState；跳过场景不播动画）
      const t = setTimeout(() => setPhase("done"), 0);
      return () => clearTimeout(t);
    }
    sessionStorage.setItem("intro-played", "1");
    const t1 = setTimeout(() => setPhase("fade"), 3600); // 描画 2.8s + 停留
    const t2 = setTimeout(() => setPhase("done"), 4400); // 淡出 0.8s 后卸载
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-paper transition-opacity duration-700 ${
        phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 640 240" className="h-32 w-auto md:h-48" role="presentation">
          {/* 描画层：stroke 手写效果（pathLength 归一化，dash 描画与字号无关） */}
          <text
            x="320"
            y="165"
            textAnchor="middle"
            pathLength={100}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fontFamily="var(--font-script)"
            fontSize="140"
            className="intro-draw"
          >
            ReZenKi
          </text>
          {/* 填充层：描画完成后渐入 */}
          <text
            x="320"
            y="165"
            textAnchor="middle"
            fill="var(--color-ink)"
            fontFamily="var(--font-script)"
            fontSize="140"
            className="intro-fill"
          >
            ReZenKi
          </text>
        </svg>
      </div>
    </div>
  );
}
