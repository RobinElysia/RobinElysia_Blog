"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "motion/react";
import { formatDate } from "@/lib/format";

/**
 * 16:9 文章图片卡（v0.14.0）
 * - 纯图片卡（16:9 比例，随机风景图铺满）
 * - 文章信息不在此处——由 Scene 的左下角 CardInfo 展示（滑动渐进渐出）
 */
const PIC_API = "https://picapi.pai.al/api/scenery.php";

export function PostCard({
  slug,
  title,
  publishedAt,
  index = 0,
}: {
  slug: string;
  title: string;
  publishedAt: Date | string | null;
  index?: number;
}) {
  // 图片：SSR/水合使用稳定 URL（slug 作 query，避免 hydration mismatch）；
  // 水合后 useEffect 加时间戳刷新为随机图（防浏览器缓存）
  const [imgSrc, setImgSrc] = useState(() => `${PIC_API}?t=${slug}`);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(`${PIC_API}?t=${slug}-${Date.now()}`);
  }, [slug]);

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative block h-full w-full overflow-hidden border border-line bg-code shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {imgFailed ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs tracking-[0.3em] text-muted uppercase">ReZenKi</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- 随机图片接口，next/image 缓存不适用
        <img
          src={imgSrc}
          alt={title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {/* 底部渐变遮罩（信息可读性） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper/80 to-transparent" />
      {/* 序号 */}
      <span className="absolute left-4 top-4 text-xs tracking-[0.3em] text-muted">
        {String(index + 1).padStart(2, "0")}
      </span>
    </Link>
  );
}

/** 左下角文章信息（滑动渐进渐出：progress MotionValue 驱动） */
export function CardInfo({
  title,
  excerpt,
  publishedAt,
  tags = [],
  progress,
}: {
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  tags?: string[];
  /** 0-1 MotionValue：进入 0→1，滚出 1→0 */
  progress: MotionValue<number>;
}) {
  const y = useTransform(progress, (p) => (1 - p) * 24);

  return (
    <motion.div
      className="pointer-events-none absolute bottom-8 left-6 z-10 max-w-xl md:left-10 md:bottom-10"
      style={{ opacity: progress, y }}
    >
      <time className="text-xs tracking-wider text-muted">{formatDate(publishedAt)}</time>
      <h3 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">{title}</h3>
      <p className="mt-3 line-clamp-2 max-w-lg text-sm leading-6 text-muted">{excerpt}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="border border-line px-1.5 py-0.5 text-[10px] text-muted">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
