"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MUSIC_TRACKS, type MusicTrack } from "@/lib/music";

/**
 * 全局音频 + 音乐 overlay 上下文（v0.23.0）
 * - 根布局挂载唯一 <audio>，跨页面播放不中断（无状态库，context 即可）
 * - 音乐页是**全屏 Overlay**（非路由）：旧页面始终挂载在底下——
 *   打开/关闭由 clip-path 圆环以导航图标为中心径向展开/收回（见 music-overlay.tsx）
 * - 事件驱动：play/pause/timeupdate/ended；ended 自动切下一首（循环播完回第一首）
 * - 浏览器自动播放策略：所有 play() 均由用户点击触发，catch 失败回落暂停态
 */

export type RevealOrigin = { x: number; y: number; r: number };

export type MusicState = {
  tracks: MusicTrack[];
  index: number;
  current: MusicTrack;
  isPlaying: boolean;
  progress: number;
  muted: boolean;
  /** overlay 是否打开（打开中旧页面保持挂载） */
  isOpen: boolean;
  /** 打开时记录的图标圆心/半径，供径向展开 */
  origin: RevealOrigin | null;
  openMusic: (origin: RevealOrigin) => void;
  closeMusic: () => void;
  playTrack: (i: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (frac: number) => void;
  toggleMute: () => void;
};

const MusicCtx = createContext<MusicState | null>(null);

export function MusicAudio({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState<RevealOrigin | null>(null);
  // 记录"是否在播放"，供切歌后延续播放状态（ended 自切也算）
  const playingRef = useRef(false);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  // 切歌：换 src；正在播放则延续播放
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = MUSIC_TRACKS[index]!.src;
    audio.load();
    if (playingRef.current) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [index]);

  const state: MusicState = {
    tracks: MUSIC_TRACKS,
    index,
    current: MUSIC_TRACKS[index]!,
    isPlaying,
    progress,
    muted,
    isOpen,
    origin,
    openMusic: (o) => {
      setOrigin(o);
      setIsOpen(true);
    },
    closeMusic: () => setIsOpen(false),
    playTrack: (i) => {
      if (i === index) return;
      setIndex(i);
    },
    toggle: () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        void audio.play().catch(() => setIsPlaying(false));
      } else {
        audio.pause();
      }
    },
    next: () => setIndex((i) => (i + 1) % MUSIC_TRACKS.length),
    prev: () => setIndex((i) => (i - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length),
    seek: (frac) => {
      const audio = audioRef.current;
      if (!audio || Number.isNaN(audio.duration)) return;
      const t = Math.min(1, Math.max(0, frac)) * audio.duration;
      audio.currentTime = t;
      setProgress(audio.duration > 0 ? t / audio.duration : 0);
    },
    toggleMute: () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = !audio.muted;
      setMuted(audio.muted);
    },
  };

  return (
    <MusicCtx.Provider value={state}>
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration > 0) setProgress(a.currentTime / a.duration);
        }}
        onEnded={() => setIndex((i) => (i + 1) % MUSIC_TRACKS.length)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      />
      {children}
    </MusicCtx.Provider>
  );
}

export function useMusic(): MusicState {
  const ctx = useContext(MusicCtx);
  if (!ctx) throw new Error("useMusic 必须在 <MusicAudio> 内使用");
  return ctx;
}
