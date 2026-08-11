/** 日期格式化："2025年7月11日" */
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 文章 URL slug 生成："Hello World!" → "hello-world" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 阅读时长估算：中文按 400 字/分钟 */
export function readingTime(markdown: string): number {
  const cjkChars = (markdown.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const otherChars = markdown.replace(/[\u4e00-\u9fa5]/g, "").length;
  return Math.max(1, Math.ceil(cjkChars / 400 + otherChars / 200));
}
