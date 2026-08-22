import type { Metadata } from "next";
import { FRIENDS } from "@/lib/friends";
import { FriendCard } from "@/components/friends/friend-card";

export const metadata: Metadata = {
  title: "友链",
  description: "ReZenKi 的朋友们——交换链接的博客与站点",
};

/**
 * /links 友链页 —— 静态数据（src/lib/friends.ts，不动 DB）
 * 渲染：SSG（纯静态，无查询参数/cookies，见 rendering-strategy.md）
 */
export default function LinksPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 md:px-8 md:py-20">
      <h1 className="mb-4 text-xs font-medium tracking-[0.25em] text-muted uppercase">友链</h1>
      <p className="max-w-lg text-sm leading-6 text-muted">
        交换链接的朋友们。相逢即缘，感谢每一次路过。
      </p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {FRIENDS.map((friend) => (
          <FriendCard key={friend.name} friend={friend} />
        ))}
      </ul>
    </main>
  );
}
