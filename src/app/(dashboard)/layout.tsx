import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

/**
 * Dashboard 布局 —— 集中鉴权（C 端不需要，仅后台）
 * 见 .claude/architecture/app-router-map.md「鉴权边界」
 * v0.21.0（修 D9）：移动端补齐顶部横向导航（侧栏 md 以下隐藏的替代方案）
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 font-sans md:px-8 md:py-12">
      {/* 移动端顶部导航（md 以下显示，侧栏的替代） */}
      <nav
        aria-label="后台导航"
        className="mb-8 flex items-center gap-4 border-b border-line pb-3 text-sm md:hidden"
      >
        <Link href="/dashboard" className="text-muted transition-colors hover:text-ink">
          概览
        </Link>
        <Link href="/dashboard/posts" className="text-muted transition-colors hover:text-ink">
          文章管理
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="ml-auto"
        >
          <button type="submit" className="text-muted transition-colors hover:text-ink">
            退出
          </button>
        </form>
      </nav>

      <div className="flex gap-10">
        {/* 侧边导航（md 及以上） */}
        <aside className="hidden w-44 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1 text-sm" aria-label="后台导航">
            <Link
              href="/dashboard"
              className="block border-l-2 border-transparent py-1 pl-3 text-muted transition-colors hover:border-ink hover:text-ink"
            >
              概览
            </Link>
            <Link
              href="/dashboard/posts"
              className="block border-l-2 border-transparent py-1 pl-3 text-muted transition-colors hover:border-ink hover:text-ink"
            >
              文章管理
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="pt-4"
            >
              <button
                type="submit"
                className="border-l-2 border-transparent py-1 pl-3 text-muted transition-colors hover:border-ink hover:text-ink"
              >
                退出登录
              </button>
            </form>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
