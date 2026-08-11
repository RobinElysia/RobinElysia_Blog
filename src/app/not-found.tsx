import Link from "next/link";

/** 全局 404（未匹配任何路由） */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 text-center md:py-32">
      <h1 className="font-script text-6xl md:text-7xl">404</h1>
      <p className="mt-4 text-sm text-muted">页面不存在。</p>
      <Link
        href="/"
        className="mt-8 inline-block border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        返回首页
      </Link>
    </main>
  );
}
