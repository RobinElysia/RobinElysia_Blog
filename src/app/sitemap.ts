import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";

/**
 * /sitemap.xml — Next.js 内置约定（app/sitemap.ts 自动路由）
 * 文章变化需反映到 sitemap，动态生成
 */
export const dynamic = "force-dynamic";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
