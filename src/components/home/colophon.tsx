"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

/**
 * Ch.03 落款 —— 签名式入场（v0.21.0，current 触发）
 * 书末页：花体签名 SVG 手写描画（draw-stroke 2.4s + 墨色渐入）→
 * 墨线展开 → © 行 → 链接行依次浮现（motion variants 错峰，总约 3s）
 * 局部背景：磨鹅毛笔的书写者蚀刻（Wellcome PDM，multiply 水印式底纹）
 * current 由 HomeScenes 的 IntersectionObserver 判定（章节中线过容器中线）
 */
const lineVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  shown: { scaleX: 1, opacity: 1, transition: { duration: 0.5, delay: 2.0, ease: [0.22, 1, 0.36, 1] } },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.5, delay: 2.3 } },
};

const fadeLinksVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.5, delay: 2.6 } },
};

export function Colophon({ current }: { current: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* 局部背景（蒙版式水印：multiply 融入纸面，dark 反转） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/archive/bg-colophon.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-[0.08] mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      <footer
        data-colophon
        className={`relative z-10 text-center ${current ? "colophon-active" : ""}`}
      >
        {/* 花体签名手写描画（SVG 两层：描边 + 墨色；CSS 动画由 .colophon-active 触发） */}
        <svg
          data-colophon-sign
          viewBox="0 0 640 220"
          className="mx-auto w-[min(78vw,480px)]"
          aria-hidden
        >
          <text
            className="colophon-draw"
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            pathLength={100}
            stroke="currentColor"
            strokeWidth={1.2}
            fill="none"
            fontFamily="var(--font-script)"
            fontSize={150}
          >
            ReZenKi
          </text>
          <text
            className="colophon-fill"
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            pathLength={100}
            fill="currentColor"
            fontFamily="var(--font-script)"
            fontSize={150}
          >
            ReZenKi
          </text>
        </svg>

        {/* 签名墨线 */}
        <motion.div
          aria-hidden
          initial={false}
          animate={current ? "shown" : "hidden"}
          variants={lineVariants}
          className="mx-auto mt-4 h-px w-56 bg-ink/60"
        />

        <motion.div initial={false} animate={current ? "shown" : "hidden"} variants={fadeVariants}>
          <p className="mt-6 text-[11px] tracking-[0.3em] text-muted uppercase">
            © 2025 ReZenKi · RefrainZen And KiKi
          </p>
        </motion.div>

        <motion.div
          initial={false}
          animate={current ? "shown" : "hidden"}
          variants={fadeLinksVariants}
        >
          <p className="mt-2 text-[11px] tracking-[0.2em] text-muted uppercase">
            <Link href="/blog" className="transition-colors hover:text-ink">
              全部文章
            </Link>
            <span className="mx-2">·</span>
            <Link href="/about" className="transition-colors hover:text-ink">
              关于
            </Link>
            <span className="mx-2">·</span>
            <Link href="/feed.xml" className="transition-colors hover:text-ink">
              RSS
            </Link>
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
