import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 text-center md:py-32">
      <h1 className="font-script text-6xl md:text-7xl">404</h1>
      <p className="mt-4 text-sm text-muted">这篇文章不存在或尚未发布。</p>
      <Link
        href="/blog"
        className="mt-8 inline-block border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        返回全部文章
      </Link>
    </main>
  );
}
