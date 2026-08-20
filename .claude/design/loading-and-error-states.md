---
status: stable
owner: design
last-updated: 2026-08-20
---

# Loading 与 Error 状态

## Loading 策略矩阵

| 场景 | 方案 | 文件 |
|------|------|------|
| 整页加载（路由切换时） | `loading.tsx`（Next.js 自动以 Suspense 包裹 page.tsx） | `app/[route]/loading.tsx` |
| 组件内异步数据 | `<Suspense fallback={...}>` | 组件文件内 |
| 按钮操作中 | `useActionState` 的 `isPending` / `useTransition` 的 `isPending` | 组件文件内 |
| Server Action 提交中 | `<button disabled={isPending}>` + 文案变化 | 组件文件内 |

> **⚠️ `loading.tsx` 会破坏该路由段的 404 状态码**：流式渲染先发 shell（200），async 页面的 `notFound()` 无法再改状态码。
> **规则**：需要真实 404 的页面（如 `/blog/[slug]`）不配 `loading.tsx`，用组件级 Suspense 代替。详见 `data-layer/streaming-and-suspense.md`。

## Skeleton 设计原则

1. **形状匹配**：骨架的形状（宽高比例）必须与真实内容一致，避免加载完成后布局跳变（CLS）。
2. **不含色彩**：只用灰色阶（`bg-gray-200 dark:bg-gray-700`），不用主题色。
3. **使用 `animate-pulse`**：Tailwind 内置的脉冲动画。
4. **至少 3 个不同大小的骨架块**：只用一个方块代表整个页面 = 敷衍。

```tsx
// ✅ 好的 Skeleton：形状匹配最终内容
function PostCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg">
      <div className="h-6 bg-gray-200 rounded w-3/4" />      {/* 标题 */}
      <div className="h-4 bg-gray-200 rounded w-1/3" />      {/* 日期 */}
      <div className="h-4 bg-gray-200 rounded w-full" />     {/* 摘要行 1 */}
      <div className="h-4 bg-gray-200 rounded w-5/6" />      {/* 摘要行 2 */}
    </div>
  );
}

// ❌ 差的 Skeleton：只有一个方块
function BadSkeleton() {
  return <div className="animate-pulse h-32 bg-gray-200 rounded" />;
}
```

## Error 策略矩阵

| 场景 | 方案 | 文件 |
|------|------|------|
| 路由级错误（整页无法渲染） | `error.tsx`（自动成为 Error Boundary） | `app/[route]/error.tsx` |
| 组件级错误（独立数据区块异常） | 手动 `<ErrorBoundary>` | 组件文件内或 `src/components/error-boundary.tsx` |
| 全局未捕获错误 | `app/global-error.tsx` | 根目录 |
| Server Action 错误 | 返回 `{ ok: false, error: "..." }`，不在客户端抛异常 | Action 文件内 |
| 404 | `not-found.tsx` + `notFound()` | `app/[route]/not-found.tsx` |

## error.tsx 编写规范

```tsx
"use client"; // error.tsx 必须是 Client Component

export default function BlogError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">出了点问题</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        页面加载失败，请稍后重试。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-block border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        重新加载
      </button>
    </main>
  );
}
```

**规则**：
- 用户看到的错误信息必须是**友好的**，不暴露技术细节（SQL 错误、堆栈追踪）
- `error.digest` 是 Next.js 生成的错误 ID，可用于日志排查，但不展示给用户
- 如果是生产环境，`error.message` 可能被 Next.js 替换为通用消息

## not-found.tsx 编写规范

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 text-center md:py-32">
      <h1 className="font-script text-6xl md:text-7xl">404</h1>
      <p className="mt-4 text-sm text-muted">页面不存在。</p>
      <Link
        href="/"
        className="mt-8 inline-block border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        返回首页
      </Link>
    </main>
  );
}
```

不需要 `"use client"`——`not-found.tsx` 可以是 Server Component。
