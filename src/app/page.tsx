import { getRecentPosts } from "@/lib/posts";
import { HomeScenes } from "@/components/home/home-scenes";

/**
 * 首页 — ReZenKi 场景化主页（v0.12.0）：
 * 3D 波浪 Hero → 3D 环形轮播（大卡片+图片）→ 滚动叠层场景转换
 * 渲染策略：SSR（force-dynamic），见 .harness/architecture/rendering-strategy.md
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await getRecentPosts(8);

  return (
    <div className="h-full min-h-0 flex-1">
      <HomeScenes posts={recent} />
    </div>
  );
}
