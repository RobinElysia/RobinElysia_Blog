"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useMusic } from "@/components/music/music-audio";
import {
  RevealCircle,
  clearRevealOrigin,
  getRevealOrigin,
  type RevealOrigin,
} from "@/components/music/circle-reveal";

/**
 * /music 播放页（v0.23.0）
 * - 打开：导航栏图标点击 → 由导航栏圆环向外覆盖全屏（图标位置半径）
 * - 关闭：反向收回（内容先淡出 → 圆环缩回图标半径 → 返回首页）
 * - 内容：图录风格——正在播放区（曲目信息 + 墨线进度 + 控制）与曲目目录
 * - 键盘：Space 播放/暂停，←/→ 切换曲目（聚焦输入控件时不拦截）
 * - reduced-motion：跳过圆环动画，直接淡入/直接返回
 */

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Phase = "reveal" | "shown" | "closing-fade" | "closing";

export function MusicPageClient() {
  const music = useMusic();
  const router = useRouter();
  const [origin] = useState<RevealOrigin | null>(() => getRevealOrigin());
  const [phase, setPhase] = useState<Phase>(() => (origin ? "reveal" : "shown"));
  const progressRef = useRef<HTMLDivElement | null>(null);

  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 开屏：圆环展开完成后显示内容
  useEffect(() => {
    if (phase === "reveal") {
      const t = setTimeout(() => setPhase("shown"), 580);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  const close = useCallback(() => {
    if (phase !== "shown") return;
    clearRevealOrigin();
    if (reduce || !origin) {
      router.push("/");
      return;
    }
    setPhase("closing-fade");
    // 内容淡出（240ms）→ 圆环缩回图标（450ms）→ 返回首页
    window.setTimeout(() => setPhase("closing"), 240);
    window.setTimeout(() => router.push("/"), 700);
  }, [phase, reduce, origin, router]);

  // 键盘控制（Space / ←/→；输入控件聚焦时不拦截）
  useEffect(() => {
    if (phase !== "shown") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.matches("input, textarea, select, button, [contenteditable]")) return;
      if (e.code === "Space") {
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
  }, [phase, music]);

  const onSeek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = progressRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      music.seek((e.clientX - rect.left) / rect.width);
    },
    [music],
  );

  const { current, isPlaying, progress, muted, index } = music;
  const contentVisible = phase === "shown" || phase === "closing-fade" || phase === "closing";

  return (
    <>
      {/* 圆环开屏/收回（reduced-motion 或无来源时跳过） */}
      {origin && (phase === "reveal" || phase === "closing") && (
        <RevealCircle
          origin={origin}
          phase={phase === "reveal" ? "open" : "close"}
          onDone={
            phase === "closing"
              ? () => {
                  /* 关闭后由 close() 的定时器导航；这里仅防重入 */
                }
              : undefined
          }
        />
      )}

      <main
        className={`mx-auto w-full max-w-4xl flex-1 px-6 py-16 transition-opacity duration-300 md:px-8 md:py-20 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 页头：小字标题 + 收起 */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">音乐</h1>
          <button
            type="button"
            onClick={close}
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
              onClick={music.toggleMute}
              aria-label={muted ? "取消静音" : "静音"}
              aria-pressed={muted}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
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
            全部曲目 · {music.tracks.length} Tracks
          </h3>
          <ul className="mt-4">
            {music.tracks.map((t, i) => {
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
      </main>
    </>
  );
}
