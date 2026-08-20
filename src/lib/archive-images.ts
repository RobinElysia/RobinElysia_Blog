/**
 * 档案图映射（DESIGN.md §4 已决方案：静态映射，不动 DB）
 * 每张图：slug 稳定绑定（选图准则：版画/蚀刻/手稿/图谱优先；Wellcome PDM 免署名义务但仍署名）
 * 元数据随图展示（小字 + 宽字距 + muted）——这是版面的一部分，不是免责声明
 * 图片来源：archival-imagery-mcp → Wellcome Collection（Public Domain Mark）
 */
export type ArchiveImage = {
  /** 本地路径（public/ 下） */
  src: string;
  title: string;
  creator: string;
  date: string;
  source: string;
  sourceUrl: string;
  license: string;
};

const ARCHIVE: Record<string, ArchiveImage> = {
  "理性与感性": {
    src: "/archive/理性与感性-wellcome-M0007634.jpg",
    title: "A philosopher studying a celestial globe",
    creator: "",
    date: "",
    source: "Wellcome Collection",
    sourceUrl: "https://wellcomecollection.org/works/fvn5yv6v",
    license: "Public Domain Mark",
  },
  "hello-rezenki": {
    src: "/archive/hello-rezenki-wellcome-V0049797.jpg",
    title: "A medical author seated at his desk, writing, a herbal on his lap",
    creator: "P. Aubry",
    date: "ca. 1657",
    source: "Wellcome Collection",
    sourceUrl: "https://wellcomecollection.org/works/ua46kfkb",
    license: "Public Domain Mark",
  },
  "why-postgres-for-blog": {
    src: "/archive/why-postgres-for-blog-wellcome-V0024913.jpg",
    title: "Astronomy: the twelve signs of the zodiac, with other astronomical charts",
    creator: "",
    date: "",
    source: "Wellcome Collection",
    sourceUrl: "https://wellcomecollection.org/works/jezbqvd3",
    license: "Public Domain Mark",
  },
  "design-tokens-in-black-and-white": {
    src: "/archive/design-tokens-in-black-and-white-wellcome-V0024667.jpg",
    title: "Clymer and Dixon's patent Columbian printing press",
    creator: "",
    date: "",
    source: "Wellcome Collection",
    sourceUrl: "https://wellcomecollection.org/works/gzv6egr4",
    license: "Public Domain Mark",
  },
  "latex-and-mermaid": {
    src: "/archive/latex-and-mermaid-wellcome-V0046512.jpg",
    title: "A scientific or astronomical diagram",
    creator: "Persian artist",
    date: "",
    source: "Wellcome Collection",
    sourceUrl: "https://wellcomecollection.org/works/bmpnhwka",
    license: "Public Domain Mark",
  },
};

export function getArchiveImage(slug: string): ArchiveImage | null {
  return ARCHIVE[slug] ?? null;
}

/** 署名格式：Creator, *Title*, date — Source (License) */
export function formatCredit(img: ArchiveImage): string {
  const parts = [img.creator, img.title ? `*${img.title}*` : "", img.date].filter(Boolean);
  return `${parts.join(", ")} — ${img.source} (${img.license})`;
}
