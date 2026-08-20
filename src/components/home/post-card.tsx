"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "motion/react";
import { formatDate } from "@/lib/format";
import { getArchiveImage, formatCredit } from "@/lib/archive-images";

/**
 * 16:9 文章图片卡（v0.21.0：档案图落地，DESIGN.md §4）
 * - 档案图（Wellcome PDM，与 slug 稳定绑定），next/image 优化（AVIF/WebP）
 * - 元数据署名随图展示（底部渐变遮罩 + 小字宽字距）——版面的一部分
 * - 无图 fallback：花体 RobinElysia 占位
 */
export function PostCard({
  slug,
  title,
  index = 0,
}: {
  slug: string;
  title: string;
  index?: number;
}) {
  const image = getArchiveImage(slug);

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative block h-full w-full overflow-hidden border border-line bg-code shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {image ? (
        <Image
          src={image.src}
          alt={image.title || title}
          fill
          sizes="(min-width: 768px) 90vw, 90vw"
          priority={index === 0}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs tracking-[0.3em] text-muted uppercase">RobinElysia</span>
        </div>
      )}
      {/* 底部渐变遮罩（署名可读性） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper/90 to-transparent" />
      {/* 档案署名（元数据即排版元素） */}
      {image && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <p className="truncate text-[10px] leading-4 tracking-[0.15em] text-muted">
            {image.creator || image.source}
            {image.date ? `, ${image.date}` : ""} · {image.license}
          </p>
        </div>
      )}
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
  slug,
}: {
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  tags?: string[];
  /** 0-1 MotionValue：进入 0→1，滚出 1→0 */
  progress: MotionValue<number>;
  slug: string;
}) {
  const y = useTransform(progress, (p) => (1 - p) * 24);
  const image = getArchiveImage(slug);

  return (
    <motion.div
      className="pointer-events-none absolute bottom-8 left-6 z-10 max-w-xl md:bottom-10 md:left-10"
      style={{ opacity: progress, y }}
    >
      <time className="text-xs tracking-wider text-muted">{formatDate(publishedAt)}</time>
      <h3 className="mt-2 text-3xl font-medium leading-tight md:text-4xl">{title}</h3>
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
      {image && (
        <p className="mt-3 line-clamp-1 max-w-lg text-[10px] tracking-[0.15em] text-muted">
          {formatCredit(image)}
        </p>
      )}
    </motion.div>
  );
}
