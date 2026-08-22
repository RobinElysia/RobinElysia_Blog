import { getPublishedPosts } from "@/lib/posts";
import { HomeScenes } from "@/components/home/home-scenes";

/**
 * 首页 — ReZenKi 章节式长滚动叙事（v0.18.0）：
 * Ch.00 波浪 Hero → Ch.01 逐卡翻页 → Ch.02 年份档案 → Ch.03 落款
 * 渲染策略：SSR（force-dynamic），见 .claude/architecture/rendering-strategy.md
 * 数据：全部已发布文章（getPublishedPosts 自带 unstable_cache；卡片章用前 4 篇，档案章用全量）
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <div className="h-full min-h-0 flex-1">
      <HomeScenes posts={posts} />
    </div>
  );
}
