/**
 * 从 Markdown 提取标题生成目录（TOC）
 * 与 rehype-slug 生成的 id 保持一致：小写、空格转 -、去标点
 */
export type TocItem = { id: string; text: string; level: 2 | 3 };

export function extractHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].trim().replace(/[`*_]/g, "");
    const id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-");
    items.push({ id, text, level });
  }
  return items;
}
