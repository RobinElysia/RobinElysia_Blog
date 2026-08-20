"use client";

import { useEffect, useRef, useState } from "react";
import { Hero } from "@/components/hero";
import { SceneCarousel } from "@/components/home/scene-carousel";
import { Chapter } from "@/components/home/chapter";
import { ChapterNav } from "@/components/home/chapter-nav";
import { setHomeScroll } from "@/components/home/scroll-source";
import { ArchiveChapter } from "@/components/home/archive-chapter";
import { Colophon } from "@/components/home/colophon";

/**
 * 首页场景组合（v0.21.0：章节式长滚动叙事）
 * 线性纵向四章（防回滚纪律：严格线性、不推翻已认可成果）：
 * - Ch.00 序   —— 3D 波浪 Hero（原样保留）
 * - Ch.01 最近 —— 逐卡翻页（原样保留，4 张大卡片）
 * - Ch.02 档案 —— 年份分组时间轴（档案元数据即排版元素）
 * - Ch.03 落款 —— 手写签名 + 导航
 * 单一滚动源：容器上唯一 rAF 节流的 scroll listener（scroll-source.ts），
 * IntersectionObserver 判定当前章节（供章节导航/进度指示消费）。
 *
 * wheel 平滑翻页（2026-08-20 用户要求"转场不顿挫、2~3s"）：
 * - 滚轮/触控板接管：easeInOut 2s 平滑滚到相邻页顶——章间转场时长 = 2s，
 *   滚动驱动动效（卡片/档案帖子）在 2s 内跟手完成，无 snap 顿挫
 * - 动画中累计滚动量达阈值可中断直跳（快速连翻不粘滞）
 * - 触摸设备/滚动条拖拽/键盘保持原生滚动；reduced-motion 下直跳
 */
const WHEEL_DURATION = 2000;

export function HomeScenes({
  posts,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
  }[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [currentChapter, setCurrentChapter] = useState("chapter-00");

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // 单一滚动源：rAF 节流，写入共享 scrollTop/viewport（订阅者零重排推导进度）
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setHomeScroll(scroller.scrollTop, scroller.clientHeight);
      });
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // wheel 平滑翻页（easeInOut 2s；中断阈值 120px 累计滚动量）
    // 目标为"锚点"：Hero + 4 卡（等高）与各章顶（offsetTop 动态算，兼容档案章超高）
    const pageH = () => scroller.clientHeight;
    let animRaf = 0;
    let animFrom = 0;
    let animTo = 0;
    let animStart = 0;
    let pendingDelta = 0;

    const stopAnim = () => {
      if (animRaf) cancelAnimationFrame(animRaf);
      animRaf = 0;
    };

    const anchors = () => {
      const base = scroller.getBoundingClientRect().top;
      const list = [0, 1, 2, 3, 4].map((i) => i * pageH());
      for (const id of ["chapter-02", "chapter-03"]) {
        const el = scroller.querySelector(`#${id}`);
        if (el) list.push(el.getBoundingClientRect().top - base + scroller.scrollTop);
      }
      return [...new Set(list)].sort((a, b) => a - b);
    };

    const animateTo = (to: number) => {
      stopAnim();
      animFrom = scroller.scrollTop;
      animTo = Math.min(Math.max(0, to), scroller.scrollHeight - pageH());
      if (Math.abs(animTo - animFrom) < 1) return;
      animStart = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - animStart) / WHEEL_DURATION);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        scroller.scrollTop = animFrom + (animTo - animFrom) * eased;
        if (t < 1) animRaf = requestAnimationFrame(step);
        else animRaf = 0;
      };
      animRaf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 2) return;
      if (animRaf) {
        // 动画中：累计滚动量达阈值则中断直跳，否则吞掉（保持 2s 转场节奏）
        pendingDelta += e.deltaY;
        if (Math.abs(pendingDelta) < 120) return;
        scroller.scrollTop = animTo;
        stopAnim();
        pendingDelta = 0;
      }
      const dir = e.deltaY > 0 ? 1 : -1;
      const list = anchors();
      const cur = scroller.scrollTop;
      const next =
        dir > 0 ? list.find((a) => a > cur + 4) : [...list].reverse().find((a) => a < cur - 4);
      if (next === undefined) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scroller.scrollTop = next;
        return;
      }
      animateTo(next);
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });

    // 当前章节判定：IntersectionObserver（root = 滚动容器，取覆盖容器中线者）
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.chapter;
            if (id) setCurrentChapter(id);
          }
        }
      },
      { root: scroller, rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    scroller.querySelectorAll("[data-chapter]").forEach((el) => observer.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      stopAnim();
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      data-scroll-container
      className="h-[calc(100dvh-var(--header-h))] overflow-y-auto"
    >
      {/* Ch.00 序：3D 波浪 Hero（原样保留） */}
      <Chapter
        id="chapter-00"
        index={0}
        label="序"
        className="h-[calc(100dvh-var(--header-h))]"
      >
        <Hero />
      </Chapter>

      {/* Ch.01 最近：逐卡翻页（原样保留，每卡一屏） */}
      <Chapter id="chapter-01" index={1} label="最近">
        <SceneCarousel posts={posts} />
      </Chapter>

      {/* Ch.02 档案：年份分组时间轴（帖子右入左出原路返回 + 书架水印背景） */}
      <Chapter
        id="chapter-02"
        index={2}
        label="档案"
        className="relative min-h-[calc(100dvh-var(--header-h))] overflow-hidden"
      >
        <ArchiveChapter posts={posts} />
      </Chapter>

      {/* 章节导航（竖向进度指示 + 章节菜单） */}
      <ChapterNav current={currentChapter} />

      {/* Ch.03 落款（手写签名触发式入场，见 colophon.tsx；书写者蚀刻背景） */}
      <Chapter
        id="chapter-03"
        index={3}
        label="落款"
        className="relative flex h-[calc(100dvh-var(--header-h))] items-center justify-center overflow-hidden"
      >
        <Colophon current={currentChapter === "chapter-03"} />
      </Chapter>
    </div>
  );
}
