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
 * - Ch.03 落款 —— 署名 + 导航
 * 单一滚动源：容器上唯一 rAF 节流的 scroll listener（scroll-source.ts），
 * IntersectionObserver 判定当前章节（供章节导航/进度指示消费）。
 */
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
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      data-scroll-container
      className="h-[calc(100dvh-var(--header-h))] snap-y snap-mandatory overflow-y-auto"
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

      {/* Ch.02 档案：年份分组时间轴（滚动驱动逐项入场 + 收缩退场） */}
      <Chapter
        id="chapter-02"
        index={2}
        label="档案"
        className="min-h-[calc(100dvh-var(--header-h))]"
      >
        <ArchiveChapter posts={posts} />
      </Chapter>

      {/* 章节导航（竖向进度指示 + 章节菜单） */}
      <ChapterNav current={currentChapter} />

      {/* Ch.03 落款（整屏停靠点：snap-mandatory 下非整屏页无法停靠，按钮跳转会被吸回；
          签名式滚动入场见 colophon.tsx） */}
      <Chapter
        id="chapter-03"
        index={3}
        label="落款"
        className="flex h-[calc(100dvh-var(--header-h))] items-center justify-center"
      >
        <Colophon />
      </Chapter>
    </div>
  );
}
