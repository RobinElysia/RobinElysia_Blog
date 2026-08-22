import { getPublishedPosts } from "@/lib/posts";
import { generateRssFeed } from "@/lib/feed";

/**
 * /feed.xml — RSS 2.0
 * Route Handler（需自定义 XML Content-Type，Server Actions 做不到）
 * 数据复用数据访问层（自带 unstable_cache）
 */
export const dynamic = "force-dynamic";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export async function GET() {
  const posts = await getPublishedPosts();
  const xml = generateRssFeed(
    posts,
    siteUrl,
    "ReZenKi",
    "ReZen And KiKi 的个人博客 — 黑白简约杂志风",
  );

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
