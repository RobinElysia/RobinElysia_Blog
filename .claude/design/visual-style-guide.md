---
status: stable
owner: design
last-updated: 2025-07-11
---

# 视觉风格指南

**品牌定稿：ReZenKi（RefrainZen And KiKi）· 黑白简约杂志风格。**

## Design Token

### 色彩：黑白灰四色体系（无彩色强调）

| Token | 用途 | 亮色值 | 暗色值 |
|-------|------|--------|--------|
| `--color-ink` | 正文/标题 | `oklch(0.13 0 0)` — 近黑 | `oklch(0.92 0 0)` — 近白 |
| `--color-paper` | 页面背景 | `oklch(0.995 0 0)` — 近白 | `oklch(0.13 0 0)` — 近黑 |
| `--color-muted` | 辅助文字 | `oklch(0.45 0 0)` — 中灰 | `oklch(0.62 0 0)` — 浅灰 |
| `--color-line` | 分割线/边框 | `oklch(0.9 0 0)` — 浅灰 | `oklch(0.28 0 0)` — 深灰 |
| `--color-code` | 代码块背景 | `oklch(0.97 0 0)` | `oklch(0.18 0 0)` |

**规则**：全站禁止使用黑白灰以外的颜色。链接不加蓝色（用下划线 + ink 色）、按钮不加彩色背景（用边框 + ink 色）、错误提示只允许文字（红色保留给极少数危险操作，且需在 ADR 中说明）。这是杂志风格的硬约束——彩色出现在任何 UI 元素上即违反规范。

### 黑白双模式

- **白模式**（默认）：白底黑字（上表"亮色值"列）
- **黑模式**（`.dark` class）：黑底白字（上表"暗色值"列），由 header 切换按钮控制 + localStorage 持久化 + 跟随系统兜底
- **组件适配要求**：所有组件必须使用 token 色（`ink/paper/muted/line/code`），禁止硬编码色值——新组件自动获得双模式。规范与反例见 `conventions/styling-conventions.md`「黑白双模式」节

### 字体体系

| Token | 用途 | 字体 | 说明 |
|-------|------|------|------|
| `--font-script` | 主页标题/Logo | **Italianno**（Google Fonts） | 意大利花体，呼应品牌名 "And" 的花体手写感 |
| `--font-sans` | 文章内容标题 | **Inter**（`--font-inter`） | SF Pro Display 的开放近似——苹果字体（SF Pro）无 web 分发版，Inter 是其最接近的开源替代 |
| `--font-sans`（正文） | 文章正文 | **系统栈**：`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI"` | 苹果自家文章（Newsroom）正文即 SF Pro Text——苹果设备上原生加载，其余平台回退 Inter/Segoe |

字体通过 `next/font/google` 在 `layout.tsx` 加载（`Inter` + `Italianno`），CSS 变量注入 Tailwind `@theme`（见 `src/app/globals.css`）。

> **为什么不用 New York？** 苹果文章的衬线字体 New York 无 web 分发版且无开源近似。杂志风的黑白排版用 SF 系无衬线（Inter）已足够干净；如未来想要衬线正文，候选为 Georgia（Windows 内置）或 Iowan Old Style，需另起设计评审。

### 字号阶梯

| 层级 | 字号 | 行高 | 用途 |
|------|------|------|------|
| `text-xs` | 0.75rem | 1rem | 日期、标签、脚注 |
| `text-sm` | 0.875rem | 1.5rem | 摘要、辅助文字 |
| `text-base` | 1rem | 1.75rem | 正文 |
| `text-2xl` | 1.5rem | 2rem | 文章标题 |
| `text-6xl` | 3.75rem | 1 | 首页 Hero（花体） |
| `text-7xl` | 4.5rem | 1 | 首页 Hero（大屏） |

### 间距与布局气质

- 间距使用 Tailwind 默认 4px 网格。
- **杂志气质**：大量留白（hero `py-20`+）、细分割线（`border-line` 1px）、大写 + 宽字距的小标签（`text-xs tracking-[0.35em] uppercase`）。
- 文章正文最大宽度 `max-w-2xl`（42rem），行高 1.75 保证长文可读性。

## 代码块样式

使用 `rehype-pretty-code` 做语法高亮（shiki 自定义主题，黑白灰层次，见 `src/lib/code-theme.ts`）。主题跟随系统亮/暗模式。

## 公式与图表写法约定（v0.7.0）

- **行内公式**：`$E = mc^2$`（remark-math + rehype-katex）
- **块级公式**：```` ```latex ```` 代码块（自定义 rehype 插件转 mathblock 组件，服务端 KaTeX 渲染）
  - ⚠️ 不要用 `$$` 块级——MDX 管线会把它行内化（踩坑记录见 `releases/0008`）
  - ⚠️ 不要用 `<MathBlock>...{...}...</MathBlock>`——children 中的 `{` 会被 MDX 当表达式
- **Mermaid 图表**：```` ```mermaid ```` 代码块（客户端动态加载渲染，黑白主题）
- 编辑器工具条可一键插入上述语法（Dashboard → 文章 → 新建/编辑）

## Logo / Favicon

文字 Logo：Italianno 花体 "ReZenKi" + 下方小字 "REFRAINZEN AND KIKI"（大写、宽字距）。
Favicon：待提供——占位用黑色方块 + 白色 "R"（衬线）。

## 动效准则

动效体系独立成文：**`design/motion-and-interaction.md`**。一句话总则：**动效是杂志的呼吸，不是装饰**——所有动画遵循黑白灰 token、克制位移（≤16px）、慢速缓动、尊重 reduced-motion。粒子/着色器/故障/彩色辉光在本项目禁用。

## 创意编写要求

网站组件设计参考以下资源进行"创意编写"（在不违反黑白克制的前提下）：
- [shadcn/ui](https://ui.shadcn.com/docs/installation) — 无头组件模式
- [Framer Motion](https://motion.dev/docs/react) — 动画引擎
- [Animate.css](https://animate.style/) — 动画效果理念
- [Apple Hello Effect](https://chanhdai.com/components/apple-hello-effect) — 首屏文字序列
