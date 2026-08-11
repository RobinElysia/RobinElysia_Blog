import { Hero } from "@/components/hero";
import { SceneCarousel } from "@/components/home/scene-carousel";

/**
 * 首页场景组合（v0.16.1：恢复原生快吸附）
 * - 局部滚动容器 + scroll-snap（原生快吸附）
 * - Scene 1：3D 波浪 Hero（慢速惯性波浪，保留）
 * - Scene 2：逐卡翻页（卡片 45° 进出场）
 * - 迷你页脚
 */
export function HomeScenes({
  posts,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | string | null;
    tags?: string[];
  }[];
}) {
  return (
    <div data-scroll-container className="h-[calc(100dvh-57px)] snap-y snap-mandatory overflow-y-auto">
      {/* Scene 1：3D 波浪 Hero（全屏） */}
      <section className="relative h-full snap-start">
        <Hero />
      </section>

      {/* Scene 2：逐卡翻页（4 张大卡片，每卡一屏） */}
      <section className="relative snap-start">
        <SceneCarousel posts={posts} />
      </section>

      {/* 迷你页脚 */}
      <footer className="relative flex h-16 snap-start items-center justify-center text-[11px] tracking-[0.3em] text-muted uppercase">
        © 2025 ReZenKi · RefrainZen And KiKi
      </footer>
    </div>
  );
}
