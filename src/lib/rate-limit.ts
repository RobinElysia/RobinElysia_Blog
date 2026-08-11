/**
 * 简单内存滑动窗口限流
 * 注意：进程内 Map，serverless 多实例下不共享（本地/单实例场景足够，
 * 多实例部署需换 Redis/数据库实现——tech-debt 记录）
 */

const WINDOW_MS = 60_000; // 60s 窗口
const MAX_PER_WINDOW = 3; // 每窗口最多 3 次

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max = MAX_PER_WINDOW, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

/** 清理过期条目（防止 Map 无限增长；每分钟由调用方触发一次） */
export function sweepRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt < now) hits.delete(key);
  }
}
