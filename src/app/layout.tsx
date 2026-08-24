import type { Metadata } from "next";
import { EB_Garamond, Inter, Italianno } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { IntroAnimation } from "@/components/intro-animation";
import { MusicAudio } from "@/components/music/music-audio";

/**
 * ReZenKi (ReZen And KiKi) — 个人博客
 * 字体体系（见 .claude/design/visual-style-guide.md，2026-08-20 定稿落地）：
 * - Italianno：意大利花体，用于 Logo/首页 Hero 大字（--font-script）
 * - EB Garamond：衬线正文/标题（--font-serif，字重 400/500/600，禁 700+）
 * - Inter：UI 控件/表单/导航系统栈链的前置回退（--font-sans）
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  description: "ReZen And KiKi 的个人博客 — 黑白简约杂志风",
  keywords: ["blog", "ReZenKi", "ReZen", "KiKi"],
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
      className={`${inter.variable} ${ebGaramond.variable} ${italianno.variable} ${themeClass}`.trim()}
    >
      <head>{/* 主题已由 SSR 输出——无任何脚本注入 */}</head>
      <body className="flex min-h-full flex-col antialiased">
        {/* 首次加载手写动画（全站入口，同会话一次；reduced-motion 自动跳过） */}
        <IntroAnimation />

        {/* 全局音频上下文（唯一 <audio>，跨页播放不中断；音乐页入口在导航栏） */}
        <MusicAudio>
          {/* 全局导航（滚动毛玻璃，见 motion-and-interaction.md） */}
          <SiteHeader />

          {children}

          <SiteFooter />
        </MusicAudio>
      </body>
    </html>
  );
}
