"use client";

/**
 * 单一滚动源（修 D3：消除"每卡一个 scroll listener + 每帧多次 getBoundingClientRect"）
 * - HomeScenes 注册唯一 rAF 节流的 scroll listener，向这里写入 scrollTop
 * - 订阅者（CardSlide / HeroContent / ChapterNav）用 useSyncExternalStore 消费
 * - snap 布局下每页高度恒定（vh - header），滚动进度可由 scrollTop 纯数学推导，零强制重排
 */
let scrollTop = 0;
let viewportH = 0; // 滚动容器可视高度（= 一页高）
const listeners = new Set<() => void>();

export function setHomeScroll(top: number, viewport: number) {
  const topChanged = top !== scrollTop;
  const vhChanged = viewport !== viewportH;
  scrollTop = top;
  viewportH = viewport;
  if (topChanged || vhChanged) listeners.forEach((l) => l());
}

export function getHomeScroll() {
  return { scrollTop, viewportH };
}

export function subscribeHomeScroll(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** 第 index 页（页高 = 1vh）相对视口的进入进度 0→1；index 为小数可表示任意元素偏移 */
export function pageProgress(index: number) {
  const { scrollTop, viewportH } = getHomeScroll();
  if (!viewportH) return 0;
  return Math.min(1, Math.max(0, 1 - index + scrollTop / viewportH));
}
