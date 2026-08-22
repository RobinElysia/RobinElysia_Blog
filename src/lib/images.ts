import { db } from "@/lib/db";
import { images } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

/** 图片数据访问层（见 .claude/api/route-handlers.md） */

export async function getImageById(id: number) {
  const [row] = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return row ?? null;
}

/** 档案图候选入库（v0.22.0）：kind='cover' + Wellcome 元数据 + 去重 work id */
export async function insertCoverImage(input: {
  data: Buffer;
  mimeType: string;
  size: number;
  sourceId: string;
  title: string;
  creator: string;
  date: string;
  source: string;
  sourceUrl: string;
  license: string;
}) {
  const [row] = await db
    .insert(images)
    .values({ ...input, kind: "cover" })
    .returning({ id: images.id });
  return row;
}

/**
 * 孤儿清扫（v0.22.0）：删除超过 24h 且未被任何文章引用的 cover 图。
 * - 只作用于 kind='cover'（inline 图在正文 markdown 中引用，无法安全判定）
 * - "被引用"= 任一文章的 cover_image 精确等于 /api/images/{id}，或正文包含该 URL
 * - 24h 窗口：用户选中一张候选但尚未保存文章时不会被误删
 */
export async function sweepOrphanCoverImages() {
  await db.execute(sql`
    DELETE FROM images img
    WHERE img.kind = 'cover'
      AND img.created_at < now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM posts p
        WHERE p.cover_image = '/api/images/' || img.id::text
           OR p.content LIKE '%/api/images/' || img.id::text || '%'
      )
  `);
}

/** 按 src 反查（编辑器绑定的 /api/images/{id} 判定） */
export function parseImageIdFromSrc(src: string): number | null {
  const m = src.match(/^\/api\/images\/(\d+)$/);
  return m ? Number(m[1]) : null;
}
