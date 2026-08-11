"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * 全局导航 —— 滚动后毛玻璃（黑白灰半透明 + backdrop-blur）
 * 黑白模式切换按钮：白模式显示 Moon（点击切黑），黑模式显示 Sun
 * 持久化 localStorage('theme')；初始跟随系统（layout.tsx 防 FOUC 脚本已应用 class）
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // capture 监听：首页使用局部滚动容器（data-scroll-container），
    // 需捕获其滚动事件以切换毛玻璃
    const onScroll = () => {
      const scroller = document.querySelector("[data-scroll-container]");
      setScrolled(scroller ? scroller.scrollTop > 8 : window.scrollY > 8);
    };
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
  }, []);

  // 水合后同步实际主题（SSR 阶段无 document）
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    // 三态 class：dark（黑）/ light（显式白，阻止媒体查询回黑）/ 无（跟随系统）
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
    // v0.19.4：SSR 从 cookie 输出主题 class（替代防 FOUC 脚本）——切换时同步写 cookie
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-line transition-colors duration-300 ${
        scrolled ? "bg-paper/70 backdrop-blur-md" : "bg-paper"
      }`}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4 md:px-8">
        <Link
          href="/"
          className="font-script text-2xl leading-none transition-transform duration-300 hover:rotate-[-2deg] hover:opacity-70"
        >
          ReZenKi
        </Link>
        <nav className="flex items-center gap-6 text-xs tracking-[0.2em] text-muted uppercase">
          <Link href="/" className="transition-colors hover:text-ink">
            首页
          </Link>
          <Link href="/blog" className="transition-colors hover:text-ink">
            文章
          </Link>
          <Link href="/archive" className="hidden transition-colors hover:text-ink sm:inline">
            归档
          </Link>
          <Link href="/about" className="hidden transition-colors hover:text-ink sm:inline">
            关于
          </Link>
          {/* 黑白模式切换（lucide-react 图标为独立 Client 用法，符合 server-client-boundary） */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "切换到白模式" : "切换到黑模式"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
          >
            {dark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
