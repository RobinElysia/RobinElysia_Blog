---
status: stable
owner: design
last-updated: 2025-07-11
---

# 响应式与无障碍

## 断点

使用 Tailwind 默认移动优先断点：

| 前缀 | 最小宽度 | 典型设备 |
|------|----------|----------|
| （无） | 0px | 手机竖屏 |
| `sm` | 640px | 手机横屏 / 小平板 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 小笔记本 |
| `xl` | 1280px | 桌面 |
| `2xl` | 1536px | 大桌面 |

**规则**：所有组件先写移动端样式，再用 `md:`、`lg:` 前缀逐级增强。不写 `max-*` 前缀的回退样式。

## 无障碍最低标准（WCAG 2.1 AA）

### 色彩对比度

- 正文文字与背景：对比度 ≥ **4.5:1**
- 大号文字（≥18px 或 ≥14px bold）与背景：对比度 ≥ **3:1**

检查工具：Chrome DevTools → Lighthouse → Accessibility 审计。

使用 oklch 颜色空间时，对比度天然容易达标（oklch 的亮度值 `L` 直接反映感知亮度）。

**黑白双模式**：两种模式（白/黑）的 token 值都必须满足上述对比度。组件用 token 色（自动适配），验收时在两种模式下各跑一次对比度检查；若引入新 token（如未来新增危险色），必须同时给亮/暗两套值。

### 键盘导航

- 所有交互元素（链接、按钮、表单）必须可通过 **Tab** 键访问
- 焦点状态必须有视觉指示（`focus:ring-2` 或 `focus:outline-2`）
- 不使用 `outline-none` 而不提供替代焦点样式
- 模态框打开时，焦点锁定在模态框内；关闭时，焦点回到触发元素

### 屏幕阅读器

- 所有 `<img>` 必须有 `alt` 属性（装饰性图片用 `alt=""`）
- 图标按钮必须有 `aria-label`（如 `<button aria-label="切换暗色模式">`）
- 页面必须有且仅有一个 `<h1>`
- 标题层级不跳级（h1 → h2 → h3，不出现 h1 → h3 跳过了 h2）
- 表单输入框必须有对应的 `<label>` 或 `aria-label`

### 语义化 HTML

- 用 `<nav>` 包裹导航，不用 `<div class="nav">`
- 用 `<article>` 包裹文章正文，不用 `<div class="article">`
- 用 `<aside>` 包裹侧边栏，不用 `<div class="sidebar">`
- 用 `<main>` 包裹主要内容，`<header>` 和 `<footer>` 分别包裹页头和页脚

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

在 `globals.css` 中加入此规则。所有动画（包括 `animate-pulse` 的骨架屏）会在此查询下停用。

## 检测工具

| 工具 | 用途 | 如何运行 |
|------|------|----------|
| Lighthouse | 综合审计（性能 + 无障碍 + SEO） | Chrome DevTools → Lighthouse 标签 |
| axe DevTools | 无障碍自动检测 | Chrome 扩展 |
| WAVE | 可视化无障碍问题 | wave.webaim.org |
| `eslint-plugin-jsx-a11y` | JSX 中的无障碍 lint | 已集成在 eslint-config-next 中 |

## 约束

- PR 中如果引入了新的交互元素，必须在描述中确认键盘可操作 + 有焦点样式
- 任何新增的 `<img>` 必须有 `alt`，否则 ESLint 报 error（`jsx-a11y/alt-text`）
