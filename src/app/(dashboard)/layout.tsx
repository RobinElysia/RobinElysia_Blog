import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

/**
 * Dashboard 布局 —— 集中鉴权（C 端不需要，仅后台）
 * 见 .harness/architecture/app-router-map.md「鉴权边界」
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-6 py-12 md:px-8">
      {/* 侧边导航 */}
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
  );
}
