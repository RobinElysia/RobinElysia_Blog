"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "motion/react";
import { formatDate } from "@/lib/format";
import {
  getArchiveImage,
  getArchiveImageBySrc,
  formatCredit,
} from "@/lib/archive-images";

/**
 * 16:9 文章图片卡（v0.21.4：文章绑定封面图）
 * - 图源优先级：文章 coverImage（编辑器绑定）→ 档案图 slug 映射（老文章兼容）→ 花体占位
 * - 档案图（Wellcome PDM）带署名元数据（底部渐变遮罩 + 小字宽字距）——版面的一部分
 */
export function PostCard({
  slug,
  title,
  coverImage,
  index = 0,
}: {
  slug: string;
  title: string;
  coverImage?: string | null;
  index?: number;
}) {
  // 封面优先；命中档案图映射时可取署名元数据
  const archive = getArchiveImage(slug);
  const src = coverImage || archive?.src || null;
  const meta = coverImage ? getArchiveImageBySrc(coverImage) ?? archive : archive;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative block h-full w-full overflow-hidden border border-line bg-code shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {src ? (
        <Image
          src={src}
          alt={meta?.title || title}
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
      {meta && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <p className="truncate text-[10px] leading-4 tracking-[0.15em] text-muted">
            {meta.creator || meta.source}
            {meta.date ? `, ${meta.date}` : ""} · {meta.license}
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
  coverImage,
}: {
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  tags?: string[];
  /** 0-1 MotionValue：进入 0→1，滚出 1→0 */
  progress: MotionValue<number>;
  slug: string;
  coverImage?: string | null;
}) {
  const y = useTransform(progress, (p) => (1 - p) * 24);
  const image = getArchiveImageBySrc(coverImage ?? "") ?? getArchiveImage(slug);

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
