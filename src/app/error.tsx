"use client";

/**
 * 全局错误边界（路由级 error.tsx，需 Client Component）
 * 规范见 .harness/design/loading-and-error-states.md
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">出了点问题</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        页面加载失败，请稍后重试。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-block border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        重新加载
      </button>
    </main>
  );
}
