"use client";

import { useMemo } from "react";

/**
 * 音乐页圆环开屏（v0.23.0）
 * - 从导航图标（圆心/半径）纸色圆向外缩放覆盖全屏（open）；关闭反向收回（close）
 * - 纯 CSS keyframes（globals.css circle-reveal-open/close），无 JS state 翻转：
 *   初始比例经 --reveal-from 自定义属性传入；onAnimationEnd 通知完成
 * - 1px line 描边 + 纸色；reduced-motion 由调用方跳过（不渲染圆环）
 */

export type RevealOrigin = { x: number; y: number; r: number };

// 跨客户端导航保存"开屏圆心"（Next App Router 软导航，模块状态存活）
let storedOrigin: RevealOrigin | null = null;
export function setRevealOrigin(o: RevealOrigin) {
  storedOrigin = o;
}
export function getRevealOrigin(): RevealOrigin | null {
  return storedOrigin;
}
export function clearRevealOrigin() {
  storedOrigin = null;
}

/** 圆心到视口最远角的距离（覆盖全域所需半径） */
function coverRadius(x: number, y: number): number {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;
}

export function RevealCircle({
  origin,
  phase,
  onDone,
}: {
  origin: RevealOrigin;
  phase: "open" | "close";
  onDone?: () => void;
}) {
  const d = useMemo(
    () => (typeof window === "undefined" ? 0 : coverRadius(origin.x, origin.y) * 2),
    [origin],
  );
  if (d === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      <div
        className={`absolute rounded-full border border-line bg-paper ${
          phase === "open" ? "animate-circle-reveal-open" : "animate-circle-reveal-close"
        }`}
        style={
          {
            left: origin.x,
            top: origin.y,
            width: d,
            height: d,
            // CSS 变量传入起始比例（中心对齐的 translate 在 keyframes 内）
            "--reveal-from": String((origin.r * 2) / d),
            transform: `translate(-50%, -50%) scale(${(origin.r * 2) / d})`,
          } as React.CSSProperties
        }
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onDone?.();
        }}
      />
    </div>
  );
}
