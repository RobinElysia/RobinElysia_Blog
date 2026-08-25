"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useMusic } from "@/components/music/music-audio";

/**
 * /music 全屏 Overlay（v0.23.0 重构——按用户规格）：
 * - 打开：以导航栏图标为圆心，`clip-path: circle(r at 图标 x y)` 半径向外扩张
 *   ——圆内逐步露出 music 页内容（旧页面仍在圆外可见），直至覆盖全屏
 * - 关闭：同一圆反向缩小收回图标，music 页被"擦掉"，回到上一页原样
 *   （Overlay 非路由：旧页面始终挂载在底下，滚动位置/状态完整保留）
 * - 扩张过程可见：独立的 1px line 圆环跟随半径同步缩放（纸面同为纸色，无边框不可见）
 * - 键盘：Space 播放/暂停，←/→ 切曲；Esc 关闭；reduced-motion 跳过动画直接切换
 */

function coverRadius(x: number, y: number): number {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function MusicOverlay() {
  const music = useMusic();
  const { isOpen, origin } = music;
  // radius = 当前 clip-path 圆半径（0 = 未挂载）；全部 setState 都在 rAF/定时器回调内（异步）
  const [radius, setRadius] = useState(0);
  const progressRef = useRef<HTMLDivElement | null>(null);
  // 会话令牌：快速开关 overlay 时，作废上一次动画的回调（防止旧 setTimeout 把新开的 overlay 杀掉）
  const sessionRef = useRef(0);

  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 打开/关闭动画驱动：首帧=图标半径 → 覆盖全域；关闭反向。reduced-motion 无过渡直达
  useEffect(() => {
    if (!origin) return;
    const session = ++sessionRef.current;
    const guard = () => session === sessionRef.current;
    if (isOpen) {
      const r1 = requestAnimationFrame(() => {
        if (!guard()) return;
        setRadius(origin.r * 2);
        const r2 = requestAnimationFrame(() => {
          cancelAnimationFrame(r2);
          if (!guard()) return;
          setRadius(coverRadius(origin.x, origin.y) * 2);
        });
      });
      return () => cancelAnimationFrame(r1);
    }
    // 关闭：收回图标半径 → 动画结束后卸载
    const r1 = requestAnimationFrame(() => {
      if (!guard()) return;
      setRadius(origin.r * 2);
    });
    const t = window.setTimeout(() => {
      if (guard()) setRadius(0);
    }, 700);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t);
    };
  }, [isOpen, origin, reduce]);

  // 底层页面滚动锁定（打开期间）
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 键盘（Space 播放/暂停、←/→ 切曲、Esc 关闭）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.matches("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") {
        music.closeMusic();
      } else if (e.code === "Space") {
        e.preventDefault();
        music.toggle();
      } else if (e.key === "ArrowRight") {
        music.next();
      } else if (e.key === "ArrowLeft") {
        music.prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, music]);

  const onSeek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = progressRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      music.seek((e.clientX - rect.left) / rect.width);
    },
    [music],
  );

  if (!origin || radius === 0) return null;

  const { current, isPlaying, progress, muted, index, tracks } = music;
  const full = coverRadius(origin.x, origin.y) * 2;
  const finished = radius >= full - 1;

  return (
    <>
      {/* 音乐页内容：以图标为圆心的圆形视口裁切（径向揭示） */}
      <section
        aria-label="音乐"
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[45] overflow-y-auto bg-paper"
        style={{
          clipPath: `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          transition: reduce ? "none" : `clip-path 0.65s ${EASE}`,
        }}
      >
        <div className="mx-auto w-full max-w-4xl px-6 pt-24 pb-16 md:px-8 md:pt-28 md:pb-20">
          {/* 页头：小字标题 + 收起（打开时自动聚焦） */}
          <div className="flex items-baseline justify-between">
            <h1 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">音乐</h1>
            <button
              type="button"
              autoFocus
              onClick={music.closeMusic}
              aria-label="收起音乐页"
              className="flex items-center gap-1.5 border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-ink hover:text-ink"
            >
              <X size={12} strokeWidth={1.5} aria-hidden />
              收起
            </button>
          </div>

          {/* 正在播放区 */}
          <section className="mt-10 border-b border-line pb-10" aria-label="正在播放">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs tracking-[0.35em] text-muted uppercase">
                  Now Playing · {current.id}
                </p>
                <h2 className="mt-2 truncate font-serif text-2xl leading-snug md:text-3xl">
                  {current.title}
                </h2>
                <p className="mt-1 truncate text-xs tracking-[0.2em] text-muted uppercase">
                  {current.artist}
                </p>
              </div>
              <span className="shrink-0 text-xs tracking-[0.3em] text-muted tabular-nums">
                {fmtDuration(progress * current.duration)} / {fmtDuration(current.duration)}
              </span>
            </div>

            {/* 墨线进度（点击跳转） */}
            <div
              ref={progressRef}
              role="slider"
              aria-label="播放进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              tabIndex={0}
              onPointerDown={onSeek}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") music.seek(Math.min(1, progress + 0.05));
                if (e.key === "ArrowLeft") music.seek(Math.max(0, progress - 0.05));
              }}
              className="group relative mt-8 h-6 cursor-pointer"
            >
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              <div
                className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-ink"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                aria-hidden
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-opacity group-hover:opacity-100"
                style={{ left: `${progress * 100}%`, opacity: 0.6 }}
              />
            </div>

            {/* 控制排 */}
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={music.prev}
                aria-label="上一首"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              >
                <SkipBack size={14} strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={music.toggle}
                aria-label={isPlaying ? "暂停" : "播放"}
                aria-pressed={isPlaying}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-ink text-ink transition-transform hover:scale-105"
              >
                {isPlaying ? (
                  <Pause size={18} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Play size={18} strokeWidth={1.5} aria-hidden className="translate-x-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={music.next}
                aria-label="下一首"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              >
                <SkipForward size={14} strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={music.toggleLoop}
                aria-label={music.loopMode === "all" ? "列表循环" : "单曲循环"}
                aria-pressed={music.loopMode === "one"}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              >
                {music.loopMode === "all" ? (
                  <Repeat size={14} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Repeat1 size={14} strokeWidth={1.5} aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={music.toggleMute}
                aria-label={muted ? "取消静音" : "静音"}
                aria-pressed={muted}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              >
                {muted ? (
                  <VolumeX size={14} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Volume2 size={14} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
          </section>

          {/* 曲目目录 */}
          <section className="mt-10" aria-label="全部曲目">
            <h3 className="text-xs tracking-[0.35em] text-muted uppercase">
              全部曲目 · {tracks.length} Tracks
            </h3>
            <ul className="mt-4">
              {tracks.map((t, i) => {
                const active = i === index;
                return (
                  <li key={t.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => (active ? music.toggle() : music.playTrack(i))}
                      aria-pressed={active && isPlaying}
                      className={`flex w-full items-baseline gap-4 py-3 text-left transition-colors hover:text-ink ${
                        active ? "text-ink" : "text-muted"
                      }`}
                    >
                      <span className="w-8 shrink-0 text-xs tracking-[0.3em] text-muted tabular-nums">
                        {t.id}
                      </span>
                      <span className="min-w-0 truncate font-serif text-base">{t.title}</span>
                      <span className="ml-auto hidden shrink-0 text-xs tracking-[0.15em] text-muted uppercase sm:inline">
                        {t.artist}
                      </span>
                      <span className="w-12 shrink-0 text-right text-xs tracking-[0.15em] text-muted tabular-nums">
                        {fmtDuration(t.duration)}
                      </span>
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 shrink-0 rounded-full bg-ink transition-opacity ${
                          active ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </section>

      {/* 扩张圆环边界（1px line，纸面同色所以必须描边才可见；覆盖完成即消失） */}
      {!reduce && !finished && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[46] rounded-full border border-line"
          style={{
            left: origin.x,
            top: origin.y,
            width: radius,
            height: radius,
            transform: "translate(-50%, -50%)",
            transition: `width 0.65s ${EASE}, height 0.65s ${EASE}`,
          }}
        />
      )}
    </>
  );
}
