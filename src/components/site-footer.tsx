"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * 全局底栏（footer，v0.22.x）
 * - 文章/归档/关于（含文章详情）：固定视口底部的浮动底栏——
 *   下滚出现、上滚隐藏（fade + 16px 位移，参考落款章淡入语言，
 *   见 .claude/design/motion-and-interaction.md「底栏显隐」）
 * - 其余页面（首页/登录/Dashboard/404）：静态页脚（首页为章节式长页，落款章自带署名）
 * - 内容短于视口（不可滚动）时恒显，保证"永远至于底"
 * - 底栏纯信息无交互元素：pointer-events-none 不拦截内容点击；隐藏时 aria-hidden
 */

/** 浮动底栏生效路径：文章列表/详情、归档、关于、友链 */
const FLOATING_PATHS = [
  /^\/blog(?:\/|$)/,
  /^\/archive(?:\/|$)/,
  /^\/about(?:\/|$)/,
  /^\/links(?:\/|$)/,
];

function FooterContent() {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-baseline justify-between px-6 py-4 text-xs text-muted md:px-8">
      <span>© 2025 ReZenKi · ReZen And KiKi</span>
      <span>黑白杂志 · 克制即表达</span>
    </div>
  );
}

/** 静态页脚（首页/Dashboard/登录/404 等）——原根布局页脚，行为不变 */
function StaticFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-4xl items-baseline justify-between px-6 py-6 text-xs text-muted md:px-8">
        <span>© 2025 ReZenKi · ReZen And KiKi</span>
        <span>黑白杂志 · 克制即表达</span>
      </div>
    </footer>
  );
}

/**
 * 浮动底栏：滚轮/键盘/滚动条方向驱动显隐
 * - 顶部（y≤8）恒隐藏；底部（距底≤8）恒显示；中间按方向切换（阈值 6px 防抖动）
 * - 监听 window scroll：营销页滚动的是文档流（首页局部滚动容器不在此路径）
 * - reduced-motion：位移归零，仅淡入淡出
 */
function FloatingFooter() {
  const reduceMotion = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const delta = y - lastY;
      if (maxY <= 8) {
        // 内容不足一屏：无滚动可言，底栏恒显
        setVisible(true);
      } else if (y <= 8) {
        setVisible(false);
      } else if (y >= maxY - 8) {
        setVisible(true);
      } else if (delta > 6) {
        setVisible(true); // 下滚 → 出现
      } else if (delta < -6) {
        setVisible(false); // 上滚 → 隐藏
      }
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.footer
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible || reduceMotion ? 0 : 16,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/80 backdrop-blur-md"
    >
      <FooterContent />
    </motion.footer>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const floating = FLOATING_PATHS.some((re) => re.test(pathname));
  return floating ? <FloatingFooter /> : <StaticFooter />;
}
