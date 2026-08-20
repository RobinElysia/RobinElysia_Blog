import type { ReactNode } from "react";

/**
 * 章节语义容器（滚动叙事 Ch.00–Ch.03）
 * - <section> + data-chapter 供 IntersectionObserver 判定当前章节
 * - 高度约定：一屏（100dvh - 全局 header 高）或按内容（档案章可超一屏）
 */
export function Chapter({
  id,
  index,
  label,
  children,
  className = "",
}: {
  id: string;
  index: number;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-chapter={id}
      data-chapter-index={index}
      aria-label={label}
      className={`snap-start ${className}`}
    >
      {children}
    </section>
  );
}
