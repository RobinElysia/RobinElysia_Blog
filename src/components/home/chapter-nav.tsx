"use client";

/**
 * 章节导航（竖向进度指示 + 章节菜单，Getty 形态但拒绝其可用性折价）
 * - nav aria-label="章节导航"；每章一个 button（Tab 可达，Enter/Space 触发）
 * - 当前章节 aria-current="step"；hover/focus 展开章节标签
 * - 点击 scrollIntoView 平滑滚动到章节（滚动容器内，行为仅对最近滚动容器生效）
 * - 同时补偿 D6（全站隐藏滚动条后无位置指示）
 */
const CHAPTERS = [
  { id: "chapter-00", label: "序" },
  { id: "chapter-01", label: "最近" },
  { id: "chapter-02", label: "档案" },
  { id: "chapter-03", label: "落款" },
] as const;

export function ChapterNav({ current }: { current: string }) {
  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="章节导航"
      className="pointer-events-none fixed top-[calc(50%+var(--header-h)/2)] right-4 z-30 -translate-y-1/2 md:right-8"
    >
      <ol className="flex flex-col items-end gap-3">
        {CHAPTERS.map((ch, i) => {
          const active = current === ch.id;
          return (
            <li key={ch.id} className="pointer-events-auto">
              <button
                type="button"
                onClick={() => jumpTo(ch.id)}
                aria-current={active ? "step" : undefined}
                aria-label={`第 ${i + 1} 章：${ch.label}`}
                title={ch.label}
                className="group flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                <span
                  className={`text-[10px] tracking-[0.25em] uppercase transition-all duration-300 ${
                    active
                      ? "text-ink opacity-100"
                      : "translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {ch.label}
                </span>
                <span
                  className={`block h-2 w-2 rounded-full border transition-all duration-300 ${
                    active
                      ? "scale-125 border-ink bg-ink"
                      : "border-line bg-paper group-hover:border-ink"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
