/**
 * RSS 2.0 生成 —— 纯函数，可单元测试
 * 见 .claude/api/route-handlers.md
 */

export type FeedItem = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
};

/** XML 转义：& < > " '（防注入与格式破坏） */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 日期格式（RSS 要求）：Fri, 11 Jul 2025 00:00:00 +0000 */
export function toRfc822(date: Date | string | null): string {
  if (!date) return new Date(0).toUTCString();
  return new Date(date).toUTCString();
}

export function generateRssFeed(
  items: FeedItem[],
  siteUrl: string,
  siteName: string,
  siteDescription: string,
): string {
  const lastBuild = items.length > 0 ? toRfc822(items[0].publishedAt) : new Date().toUTCString();

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${siteUrl}/blog/${encodeURIComponent(item.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${encodeURIComponent(item.slug)}</guid>
      <description>${escapeXml(item.excerpt)}</description>
      <pubDate>${toRfc822(item.publishedAt)}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${itemXml}
  </channel>
</rss>`;
}
