import type { Metadata } from "next";
import { Inter, Italianno } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

/**
 * ReZenKi (RefrainZen And KiKi) — 个人博客
 * 字体体系（见 .claude/design/visual-style-guide.md）：
 * - Italianno：意大利花体，用于主页标题/Logo
 * - Inter：SF Pro Display 的开放近似，用于文章标题
 * - 正文走系统栈（-apple-system → 苹果设备上即 SF Pro Text）
 * ⚠️ 注意：visual-style-guide.md 已定稿 EB Garamond（--font-serif），
 *    本文件仍加载 Inter——迁移待用户完成（tech-debt.md 登记）
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const italianno = Italianno({
  variable: "--font-italianno",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "ReZenKi",
    template: "%s · ReZenKi",
  },
  description: "RefrainZen And KiKi 的个人博客 — 黑白简约杂志风",
  keywords: ["blog", "ReZenKi", "RefrainZen", "KiKi"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // v0.19.4 主题方案：SSR 直接从 cookie 输出主题 class（替代防 FOUC 脚本）
  // 为什么：React 19 对 React 渲染的任何 <script>（内联/外部/next/script）都会告警，
  // 且水合时脚本不执行——三次尝试（内联 script → next/script → 外部文件）均失败。
  // 改为：切换主题时写 cookie（samesite=lax），SSR 读 cookie 输出 <html class="dark|light">，
  // 首帧即正确主题（无 FOUC、无 script、无警告）；无 cookie 时由 CSS 媒体查询跟随系统。
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  const themeClass = theme === "dark" ? "dark" : theme === "light" ? "light" : "";

  return (
    // suppressHydrationWarning：主题 class 由服务端输出，客户端水合时跳过该元素属性对比
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${italianno.variable} ${themeClass}`.trim()}
    >
      <head>{/* 主题已由 SSR 输出——无任何脚本注入 */}</head>
      <body className="flex min-h-full flex-col antialiased">
        {/* 全局导航（滚动毛玻璃，见 motion-and-interaction.md） */}
        <SiteHeader />

        {children}

        <footer className="mt-16 border-t border-line">
          <div className="mx-auto flex w-full max-w-4xl items-baseline justify-between px-6 py-6 text-xs text-muted md:px-8">
            <span>© 2025 ReZenKi · RefrainZen And KiKi</span>
            <span>黑白杂志 · 克制即表达</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
