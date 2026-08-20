"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { subscribeHomeScroll, getHomeScroll } from "@/components/home/scroll-source";

/**
 * 全局导航 —— 滚动后毛玻璃（黑白灰半透明 + backdrop-blur）
 * 黑白模式切换按钮：白模式显示 Moon（点击切黑），黑模式显示 Sun
 * 持久化 localStorage('theme') + cookie（SSR 主题，v0.19.4）
 * dark 状态用 useSyncExternalStore 读 <html> class（SSR 返回 false；
 * 水合后 MutationObserver 自动同步——避免 setState-in-effect，v0.19.14）
 */

/** 监听 <html> class 变化（主题切换同步） */
function subscribeTheme(cb: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function readTheme(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  // 主题状态：直接读 DOM（服务端返回 false；水合后 MutationObserver 实时同步）
  const dark = useSyncExternalStore(subscribeTheme, readTheme, () => false);

  useEffect(() => {
    // v0.21.0（修 D8）：不再全局 capture 监听兜底——
    // 首页滚动由共享滚动源（scroll-source.ts）上报，其他页面仍监听 window
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 首页局部滚动容器（data-scroll-container）的滚动：订阅共享源（无 capture hack）
  useEffect(() => {
    const unsub = subscribeHomeScroll(() => {
      if (document.querySelector("[data-scroll-container]")) {
        setScrolled(getHomeScroll().scrollTop > 8);
      }
    });
    return unsub;
  }, []);

  // 水合后同步实际主题（SSR 阶段无 document）——useSyncExternalStore 已接管，删除原 effect

  const toggleTheme = () => {
    const next = !dark;
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
          className="font-script text-xl leading-none transition-transform duration-300 hover:rotate-[-2deg] hover:opacity-70 md:text-2xl"
        >
          RobinElysia
        </Link>
        <nav className="flex items-center gap-6 font-sans text-xs tracking-[0.2em] text-muted uppercase">
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
