/**
 * 档案图候选源（v0.22.0）
 * ---------------------
 * 编辑器"获取 3 张档案图"的服务端实现：直连 Wellcome Collection API
 * （检索逻辑参考 archival-imagery-mcp v0.2.1 的 Wellcome 部分，MIT，
 *  作者 Harpreet Chandhoke —— 见 .claude/architecture/adr/0006）。
 *
 * 为什么不用 MCP stdio server：MCP 是给 agent 客户端（Claude Desktop 等）用的
 * 进程协议，不适合嵌进 Next.js 请求链路；其 Wellcome 工具本质就是对 REST API
 * 的薄封装（免 API key），本项目直接复用同等调用逻辑，零新增依赖。
 *
 * 选图纪律（DESIGN.md §4）：
 * - 只收 PDM / CC0 / CC-BY，排除 In copyright / All rights reserved / 无 license
 * - 去重：站内已用 work id（静态映射 + images.source_id）不再推荐
 */

import { db } from "@/lib/db";
import { images } from "@/lib/schema";
import { isNotNull } from "drizzle-orm";
import { getArchiveWorkIds } from "@/lib/archive-images";
import { insertCoverImage, sweepOrphanCoverImages } from "@/lib/images";

const WELLCOME_BASE = "https://api.wellcomecollection.org/catalogue/v2";
const WELLCOME_IIIF = "https://iiif.wellcomecollection.org/image";
const UA = "rezenki-blog/0.22.0 (editor-cover-candidates)";

/** 单张下载字节上限（与 upload-image 的 5MB 一致） */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** 单次外部请求超时 */
const FETCH_TIMEOUT_MS = 8000;

/** 无关键词时的主题池（与站内档案气质同域：天文/植物/解剖/炼金/印刷/地图/手稿） */
export const QUERY_POOL = [
  "astronomy",
  "botany",
  "anatomy",
  "alchemy",
  "engraving",
  "printing press",
  "maps",
  "manuscripts",
  "herbal",
  "telescope",
  "microscope",
  "astrology",
];

/** IIIF 图 URL 构造：接受 iiif.wellcomecollection.org/image/XXXX 或裸 id */
export function buildWellcomeImageURL(iiifId: string, size = "1200,"): string {
  const m = String(iiifId).match(/\/image\/([^/]+)/);
  const id = m ? m[1] : iiifId;
  return `${WELLCOME_IIIF}/${id}/full/${size}/0/default.jpg`;
}

/** license 白名单：PDM / CC0 / CC BY* 可用；版权未明/禁止类排除 */
export function isUsableLicense(label?: string | null): boolean {
  if (!label) return false;
  const l = label.toLowerCase();
  if (l.includes("in copyright") || l.includes("all rights reserved")) return false;
  return l.includes("public domain") || l.includes("cc0") || l.includes("cc by");
}

export type WellcomeImageHit = {
  id: string;
  workId: string;
  title: string;
  iiifId: string;
  creator: string;
  license: string;
};

/** 从主题池随机取一个查询词（rng 注入便于测试） */
export function pickQuery(rng: () => number = Math.random): string {
  return QUERY_POOL[Math.floor(rng() * QUERY_POOL.length)]!;
}

/** 判断单条 images 命中是否可用（有 IIIF、license 合规、work 未被使用） */
export function toUsableHit(raw: unknown, excludedWorkIds: Set<string>): WellcomeImageHit | null {
  const r = raw as {
    id?: string;
    source?: { id?: string; title?: string; contributors?: { agent?: { label?: string } }[] };
    thumbnail?: { url?: string };
    locations?: { license?: { label?: string } }[];
  };
  const workId = r.source?.id;
  const iiifId = r.thumbnail?.url?.match(/\/image\/([^/]+)/)?.[1];
  if (!r.id || !workId || !iiifId) return null;
  if (excludedWorkIds.has(workId)) return null;
  const license = r.locations?.[0]?.license?.label ?? "";
  if (!isUsableLicense(license)) return null;
  return {
    id: r.id,
    workId,
    title: r.source?.title || "(untitled)",
    iiifId,
    creator: r.source?.contributors?.[0]?.agent?.label ?? "",
    license,
  };
}

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Wellcome API HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** 下载一张 IIIF 图（width 1200 ≈ 400-600KB），超限/非图返回 null */
async function downloadIiiif(iiifId: string): Promise<{ data: Buffer; mimeType: string } | null> {
  const res = await fetch(buildWellcomeImageURL(iiifId), {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS * 2),
  });
  if (!res.ok) return null;
  const mime = res.headers.get("content-type") ?? "";
  if (!mime.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
  return { data: buf, mimeType: mime };
}

/** 已用 work id 集合：images 表 source_id + 静态 ARCHIVE 映射的 work id */
async function getExcludedWorkIds(): Promise<Set<string>> {
  const rows = await db
    .select({ sourceId: images.sourceId })
    .from(images)
    .where(isNotNull(images.sourceId));
  return new Set([...rows.map((r) => r.sourceId!), ...getArchiveWorkIds()]);
}

export type CoverCandidate = {
  id: number;
  url: string;
  title: string;
  creator: string;
  date: string;
  source: string;
  sourceUrl: string;
  license: string;
};

/**
 * 获取 3 张新档案图候选：检索 → 过滤 → 下载 3 张入库 → 返回本地引用
 * - 关键词缺省时从主题池随机抽取；单次检索不足 3 张时换词续搜（最多 5 次尝试）
 * - 失败策略：检索全失败抛错（上游不可用）；个别下载失败静默跳过换下一张
 */
export async function fetchArchiveCandidates(query?: string): Promise<CoverCandidate[]> {
  // 先清扫孤儿候选（>24h 未被任何文章引用/未写入正文的 cover 图）
  await sweepOrphanCoverImages();
  const excluded = await getExcludedWorkIds();

  const queries = query?.trim() ? [query.trim()] : Array.from({ length: 5 }, () => pickQuery());

  const pool: WellcomeImageHit[] = [];
  const seenWorks = new Set<string>();

  for (const q of queries) {
    if (pool.length >= 3) break;
    const data = (await fetchJSON(
      `${WELLCOME_BASE}/images?query=${encodeURIComponent(q)}&pageSize=10&include=source.contributors`,
    )) as { results?: unknown[] };
    for (const raw of data.results ?? []) {
      if (pool.length >= 6) break;
      const hit = toUsableHit(raw, excluded);
      if (!hit || seenWorks.has(hit.workId)) continue;
      seenWorks.add(hit.workId);
      pool.push(hit);
    }
  }
  if (pool.length === 0) {
    throw new Error("未找到可用档案图：可能是上游服务暂不可用，请稍后重试或换关键词");
  }

  // 下载并入库，凑满 3 张即止
  const candidates: CoverCandidate[] = [];
  for (const hit of pool) {
    if (candidates.length >= 3) break;
    const dl = await downloadIiiif(hit.iiifId);
    if (!dl) continue;
    const row = await insertCoverImage({
      data: dl.data,
      mimeType: dl.mimeType,
      size: dl.data.length,
      sourceId: hit.workId,
      title: hit.title,
      creator: hit.creator,
      date: "", // images 端点不提供年代，需 works 端点二次查询——成本/收益不划算，留空
      source: "Wellcome Collection",
      sourceUrl: `https://wellcomecollection.org/works/${hit.workId}`,
      license: hit.license,
    });
    candidates.push({
      id: row.id,
      url: `/api/images/${row.id}`,
      title: hit.title,
      creator: hit.creator,
      date: "",
      source: "Wellcome Collection",
      sourceUrl: `https://wellcomecollection.org/works/${hit.workId}`,
      license: hit.license,
    });
  }

  if (candidates.length === 0) {
    throw new Error("候选图下载失败：请稍后重试");
  }
  return candidates;
}
