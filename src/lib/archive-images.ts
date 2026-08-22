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
  理性与感性: {
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

/**
 * 编辑器预设图集（封面选择，2026-08-20）：
 * 站内全部档案图（含 Hero/散落/背景图），按 slug 映射优先、其余按主题排列
 */
export const PRESET_GALLERY: { src: string; label: string }[] = [
  { src: "/archive/理性与感性-wellcome-M0007634.jpg", label: "哲学家与天球仪" },
  { src: "/archive/hello-rezenki-wellcome-V0049797.jpg", label: "书写的医学作者" },
  { src: "/archive/why-postgres-for-blog-wellcome-V0024913.jpg", label: "黄道十二宫天文图" },
  { src: "/archive/design-tokens-in-black-and-white-wellcome-V0024667.jpg", label: "印刷机" },
  { src: "/archive/latex-and-mermaid-wellcome-V0046512.jpg", label: "波斯科学图解" },
  { src: "/archive/hero-paradise.jpg", label: "伊甸园" },
  { src: "/archive/scatter-1.jpg", label: "明代本草" },
  { src: "/archive/scatter-2.jpg", label: "哥白尼与天文仪器" },
  { src: "/archive/scatter-3.jpg", label: "解剖图" },
  { src: "/archive/scatter-4.jpg", label: "几何与透视" },
  { src: "/archive/scatter-5.jpg", label: "望远镜观星" },
  { src: "/archive/scatter-6.jpg", label: "医神与象征物" },
  { src: "/archive/bg-archive.jpg", label: "书房书架" },
  { src: "/archive/bg-colophon.jpg", label: "磨鹅毛笔的书写者" },
];

/** 按 src 反查档案图元数据（编辑器预设图命中映射时可得署名） */
export function getArchiveImageBySrc(src: string): ArchiveImage | null {
  return Object.values(ARCHIVE).find((img) => img.src === src) ?? null;
}

/** 静态映射里所有 Wellcome work id（编辑器档案图候选去重用） */
export function getArchiveWorkIds(): string[] {
  return Object.values(ARCHIVE)
    .map((img) => {
      const m = img.sourceUrl.match(/works\/([^/]+)/);
      return m ? m[1] : null;
    })
    .filter((v): v is string => v !== null);
}

/** 署名格式：Creator, *Title*, date — Source (License) */
export function formatCredit(img: ArchiveImage): string {
  const parts = [img.creator, img.title ? `*${img.title}*` : "", img.date].filter(Boolean);
  return `${parts.join(", ")} — ${img.source} (${img.license})`;
}
