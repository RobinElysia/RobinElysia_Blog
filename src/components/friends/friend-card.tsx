import type { Friend, FriendTagColor } from "@/lib/friends";

/**
 * 友链卡片（v0.22.x，用户要求去掉头像——只要名字/简介/tag）
 * - 无链接：渲染纯卡片（链接待补，先空着）
 * - tag 彩色例外：站长指定三色（purple/green/orange，DESIGN.md §2），
 *   值在 globals.css 的 --color-friend-* token（亮/暗两套）
 */

/** 无彩色 tag 走 token；彩色 tag 用例外色 token */
const TAG_COLOR_CLASS: Record<FriendTagColor, string> = {
  purple: "border-friend-purple/40 text-friend-purple",
  green: "border-friend-green/40 text-friend-green",
  orange: "border-friend-orange/40 text-friend-orange",
};

export function FriendCard({ friend }: { friend: Friend }) {
  const inner = (
    <>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-medium leading-7">{friend.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{friend.description}</p>
      </div>

      {friend.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {friend.tags.map((tag) => (
            <span
              key={tag.text}
              className={`border px-1.5 py-0.5 text-[10px] tracking-wide ${
                tag.color ? TAG_COLOR_CLASS[tag.color] : "border-line text-muted"
              }`}
            >
              {tag.text}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const cardClass =
    "flex h-full flex-col border border-line bg-transparent p-5 transition-colors duration-300";

  if (!friend.link) {
    return (
      <li>
        <div className={cardClass}>
          {inner}
          <p className="mt-auto pt-4 text-[10px] tracking-[0.2em] text-muted/60 uppercase">
            链接待补充
          </p>
        </div>
      </li>
    );
  }

  return (
    <li>
      <a
        href={friend.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClass} hover:border-ink`}
      >
        {inner}
      </a>
    </li>
  );
}
