---
status: stable
owner: design
implementation-status: in-progress  # token/字体已落地代码（2026-08-20）；图像规范（档案图）落地中
last-updated: 2026-08-20
---

# 视觉风格指南

**品牌定稿：RobinElysia（Robin And Elysia）· 简约复古艺术风（档案馆气质）。**

> 风格定位、色彩与字体的**决策理由**见根目录 `DESIGN.md`。本文件只承载**落地 Token 与写法细则**，不重复论证。

## Design Token

### 色彩：暖纸五色体系（无彩色强调）

底色是做旧纸张而非纯白，墨色是暖黑而非纯黑。**彩度上限 chroma ≤ 0.015**——超过即违反"纸感而非彩色"的定位。

| Token | 用途 | 白模式 | ≈hex | 黑模式 | ≈hex |
|-------|------|--------|------|--------|------|
| `--color-ink` | 正文/标题 | `oklch(0.22 0.015 60)` | `#201914` | `oklch(0.91 0.012 85)` | `#e5e1d9` |
| `--color-paper` | 页面背景 | `oklch(0.97 0.012 85)` | `#f9f5ec` | `oklch(0.18 0.012 60)` | `#16100c` |
| `--color-muted` | 辅助文字 | `oklch(0.50 0.015 70)` | `#69625a` | `oklch(0.68 0.012 75)` | `#9d9790` |
| `--color-line` | 分割线/边框 | `oklch(0.87 0.015 80)` | `#d9d3c9` | `oklch(0.32 0.014 65)` | `#38312b` |
| `--color-code` | 代码块/卡片底 | `oklch(0.94 0.014 85)` | `#efebe1` | `oklch(0.23 0.012 60)` | `#211c17` |

**实测对比度（WCAG 2.1 AA 全部通过）**

| 组合 | 白模式 | 黑模式 |
|------|--------|--------|
| ink / paper | 15.91 | 14.41 |
| muted / paper | 5.51 | 6.53 |
| ink / code | 14.55 | 12.95 |
| muted / code | 5.04 | 5.87 |

`line` 为纯装饰边框（1.36 / 1.48），不承载文字，WCAG 无对比度要求。

**规则**：全站 UI 禁止使用上述五个 token 以外的颜色。链接不加蓝色（下划线 + ink）、按钮不加彩色背景（边框 + ink）、标签用边框 + muted。**页面的色彩浓度全部来自藏品图本身，UI 一滴不出**（Getty Tracing Art 的取舍逻辑，见 `DESIGN.md` §1）。红色仅保留给极少数破坏性操作，且需先写 ADR 并同时提供亮/暗两套值。

### 黑白双模式

- **白模式**（默认）：纸底墨字（上表"白模式"列）
- **黑模式**（`.dark` class）：深褐墨底暖白字（上表"黑模式"列），由 header 切换按钮控制 + localStorage 持久化 + 跟随系统兜底
- **组件适配要求**：所有组件必须使用 token 色（`ink/paper/muted/line/code`），禁止硬编码色值——新组件自动获得双模式。规范与反例见 `conventions/styling-conventions.md`「黑白双模式」节

### 字体体系

| Token | 用途 | 字体 | 说明 |
|-------|------|------|------|
| `--font-script` | Logo / 首页 Hero 大字 | **Italianno**（Google Fonts） | 意大利花体，呼应品牌名 "And" 的花体手写感 |
| `--font-serif` | 文章标题 + 正文 | **EB Garamond**（Google Fonts, OFL） | 16 世纪 Garamond 开源复刻，博物馆图录标准选择；旧样式字形与 15–19 世纪藏品图同时代 |
| `--font-sans` | UI 控件 / Dashboard / 表单 | **系统栈**：`-apple-system, BlinkMacSystemFont, "Segoe UI"` | 后台不需要复古感，保持中性高效 |

字体通过 `next/font/google` 在 `layout.tsx` 加载（`EB_Garamond` + `Italianno`），CSS 变量注入 Tailwind `@theme`（见 `src/app/globals.css`）。

> **中文回退（必须显式声明）**：EB Garamond 无中文字形。`--font-serif` 的 fallback 链必须包含中文衬线（`"Songti SC", "Noto Serif SC", SimSun, serif`），否则中文会掉到无衬线，与英文正文割裂。

**字重约束**：正文 400，标题 500–600。**禁止 700+**——图录不吼。

> **为什么从 Inter 换成 EB Garamond？** 博物馆图录与艺术出版物的正文几乎无一例外是衬线体；无衬线正文与档案馆气质存在气质断层。这是本文件此前标注为"待设计评审"的悬置项，已在 `DESIGN.md` §3 结案。备选 Cormorant Garamond（标题好看但正文偏轻）、Libre Baskerville（屏幕可读性好但年代感偏晚）。

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
- **图录气质**：大量留白（hero `py-20`+）、细分割线（`border-line` 1px）、大写 + 宽字距的小标签（`text-xs tracking-[0.35em] uppercase`）。
- 文章正文最大宽度 `max-w-3xl`，行高 1.75 保证长文可读性。

> **元数据即排版元素**：藏品的年代、馆藏方、编号，以及文章日期、标签，统一用 `text-xs tracking-[0.35em] uppercase text-muted`。这不是附注，是构成版面节奏的一等元素（Getty Tracing Art 的核心手法）。

### 图像

图像是内容而非配图。**必须使用 `archival-imagery-mcp` 取得的公共领域藏品图**，禁止随机图 API、AI 生图、通用库存摄影。

- 落盘路径 `public/archive/<slug>-<source>-<id>.jpg`，走 `next/image`（AVIF/WebP 已在 `next.config.ts` 配置）
- 必带 `width`/`height`（防 CLS）、有信息量的 `alt`（写藏品标题）、license 署名
- 允许的处理：`object-cover` 裁切、`bg-code` 底衬、1px `border-line` 描边、`from-paper/80` 底部渐变（保证叠字可读）
- 禁止：做旧滤镜、彩色叠层、饱和度拉满、圆角 ≥ 8px（图录是方的）

完整取图流程、来源版权表、选图准则见 `DESIGN.md` §4。

## 代码块样式

使用 `rehype-pretty-code` 做语法高亮（shiki 自定义主题，暖纸色调下的墨色层次，见 `src/lib/code-theme.ts`）。主题跟随系统亮/暗模式。

## 公式与图表写法约定（v0.7.0）

- **行内公式**：`$E = mc^2$`（remark-math + rehype-katex）
- **块级公式**：```` ```latex ```` 代码块（自定义 rehype 插件转 mathblock 组件，服务端 KaTeX 渲染）
  - ⚠️ 不要用 `$$` 块级——MDX 管线会把它行内化（踩坑记录见 `releases/0008`）
  - ⚠️ 不要用 `<MathBlock>...{...}...</MathBlock>`——children 中的 `{` 会被 MDX 当表达式
- **Mermaid 图表**：```` ```mermaid ```` 代码块（客户端动态加载渲染，黑白主题）
- 编辑器工具条可一键插入上述语法（Dashboard → 文章 → 新建/编辑）

## Logo / Favicon

文字 Logo：Italianno 花体 "RobinElysia" + 下方小字 "ROBIN AND ELYSIA"（大写、宽字距）。
Favicon：待提供——占位用黑色方块 + 白色 "R"（衬线）。

## 动效准则

动效体系独立成文：**`design/motion-and-interaction.md`**。一句话总则：**动效是纸页翻动的呼吸，不是装饰**——所有动画遵循暖纸 token、克制位移（≤16px）、慢速缓动、尊重 reduced-motion。粒子/着色器/故障/彩色辉光在本项目禁用；做旧特效（胶片颗粒、划痕、泛黄叠层）同样禁用——复古感来自纸色、衬线、真实藏品，不来自滤镜。

## 创意编写要求

网站组件设计参考以下资源进行"创意编写"（在不违反黑白克制的前提下）：
- [shadcn/ui](https://ui.shadcn.com/docs/installation) — 无头组件模式
- [Framer Motion](https://motion.dev/docs/react) — 动画引擎
- [Animate.css](https://animate.style/) — 动画效果理念
- [Apple Hello Effect](https://chanhdai.com/components/apple-hello-effect) — 首屏文字序列
