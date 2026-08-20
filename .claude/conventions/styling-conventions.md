---
status: stable
owner: conventions
last-updated: 2026-08-19
---

# 样式编写约定

## Tailwind CSS 4 使用边界

本项目使用 Tailwind CSS 4（`@tailwindcss/postcss` 插件）。

**规则**：
- 所有样式优先用 Tailwind utility class，不创建新的 CSS 文件。
- 当同一个 utility 组合出现 **3 次以上** 时，抽取为 `@utility` 或组件，不在每个地方重复写 class 串。
- `@apply` 指令保留给无法用 utility 表达的复杂选择器（如 `::before`、`::after`）。

## CSS Modules

**使用场景**（同时满足以下两条才用 CSS Modules）：
1. 样式无法用 Tailwind utility 表达（如复杂动画 `@keyframes`、`::backdrop` 样式）
2. 样式是组件私有的（不共享）

**不用 CSS Modules 的场景**：
- "这个按钮的 padding 是 14px 但 Tailwind 没有 `p-14`" → 用 Tailwind 的任意值 `p-[14px]`，不需要 CSS Module。

## Design Token 引用

Design Token（颜色、字体、间距）由 `design/visual-style-guide.md` 定义，通过以下方式引用：

### 颜色
在 `src/app/globals.css` 中用 CSS 变量 + Tailwind theme 扩展。**只有五个 token，彩度上限 chroma ≤ 0.015**（暖纸色调，完整值见 `design/visual-style-guide.md`）：
```css
@import "tailwindcss";

@theme {
  --color-ink: oklch(0.22 0.015 60);    /* 暖墨黑 — 正文/标题 */
  --color-paper: oklch(0.97 0.012 85);  /* 做旧纸 — 页面背景 */
  --color-muted: oklch(0.5 0.015 70);   /* 暖灰 — 辅助文字 */
  --color-line: oklch(0.87 0.015 80);   /* 分割线/边框 */
  --color-code: oklch(0.94 0.014 85);   /* 代码块/卡片底 */
}
```
然后在组件中用 `bg-paper`、`text-ink`、`text-muted`、`border-line` 引用。

### 字体
字体通过 `next/font/google` 加载，在根 layout 中配置 CSS 变量，再注入 Tailwind theme。

```ts
// app/layout.tsx
import { EB_Garamond, Italianno } from "next/font/google";
const serif = EB_Garamond({ subsets: ["latin"], variable: "--font-serif" });
const script = Italianno({ weight: "400", subsets: ["latin"], variable: "--font-script" });
```
```css
/* globals.css */
@theme {
  /* EB Garamond 无中文字形，fallback 链必须显式带中文衬线 */
  --font-serif: var(--font-eb-garamond), "Songti SC", "Noto Serif SC", SimSun, serif;
  --font-script: var(--font-italianno), cursive;
}
```
然后用 `font-serif`、`font-script` 引用。字体角色分工见 `design/visual-style-guide.md`「字体体系」。

## 黑白双模式（组件适配硬性要求）

**本项目的"暗色模式"是黑白双模式：白模式（白底黑字）↔ 黑模式（黑底白字），通过 `<html class="dark">` 切换。**

### 实现机制

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));  /* Tailwind dark: 变体跟随 class */
@theme { /* 白模式 token（默认） */ }
.dark { /* 黑模式 token 覆盖 */ }
@media (prefers-color-scheme: dark) { :root:not(.light) { /* 跟随系统兜底 */ } }
```

- 切换按钮：`SiteHeader`（lucide-react Moon/Sun），持久化 `localStorage("theme")`
- 防 FOUC：`layout.tsx` 头部 inline script，首帧前应用 `.dark`
- 无手动选择时跟随系统偏好

### ⚠️ 防 FOUC 脚本与水合的坑（踩坑记录）

脚本会在 React 水合**之前**修改 `<html>` 的 class（添加/移除 `dark`），React 水合时对比服务器 className 会发现差异 → `hydration mismatch` 控制台报错（页面仍工作，但 React 跳过该属性修补）。

**规则**：使用任何会在水合前修改 `<html>` 属性的脚本时，`<html>` 必须加 `suppressHydrationWarning`（React 官方针对"外部脚本改属性"场景的逃逸阀，next-themes 等所有主题库同款做法）。脚本放 `<head>` 而非 `<body>`，执行更早、白闪更小。

### 组件适配规则（后续每个组件必须遵守）

1. **禁止硬编码色值**：组件里只允许使用 token（`text-ink`、`bg-paper`、`text-muted`、`border-line`、`bg-code`），禁止 `text-black`、`bg-white`、`#fff`、`bg-gray-*` 等字面量。黑白模式自动适配的唯一途径就是 token。
2. **需要模式差异时用 `dark:` 变体**：`dark:bg-paper`、`dark:prose-invert`（Tailwind 已配置跟随 `.dark` class）。
3. **验收标准**：新组件提交前必须验证两种模式（切到黑模式看一遍），Code Review 检查项"组件是否使用 token 色"。

```tsx
// ✅ 正确：token 色，自动适配黑白
<button className="border border-ink bg-paper text-ink hover:bg-ink hover:text-paper">

// ❌ 错误：硬编码，黑模式下按钮仍是白底黑字（或黑底黑字不可见）
<button className="border border-black bg-white text-black">
```

**反例**：如果某组件用了 `bg-white`，黑模式下它是刺眼的白块；用 `bg-paper` 则自动变成黑模式下的深色块。这是"写死一个值，丢掉整个模式"的典型错误。

### 对比度要求

两种模式下 token 值都已满足 WCAG 2.1 AA（ink/paper ≥ 4.5:1，muted 在两种模式均 ≥ 4.5:1 于 paper 上）。新 token 引入时按 `responsive-and-a11y.md` 校验。

## 响应式断点

使用 Tailwind 默认断点：`sm`(640px) → `md`(768px) → `lg`(1024px) → `xl`(1280px) → `2xl`(1536px)。

**移动优先**：所有样式默认为移动端编写，通过 `md:`、`lg:` 前缀逐级增强。

```tsx
// ✅ 正确：移动优先
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ 错误：桌面优先然后用 max-* 回退
<div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
```

## 禁用规则

- ❌ 不使用内联 style（`style={{ color: "red" }}`）——除非值在运行时动态计算（如进度条宽度）。
- ❌ 不使用 `!important`（Tailwind 的 `!` 前缀同理）——如果选择器优先级不够，说明 CSS 结构有问题。
- ❌ 不直接在组件中 import 未做 CSS Module 隔离的 `.css` 文件（会被 Next.js 拒绝或有全局污染风险）。
