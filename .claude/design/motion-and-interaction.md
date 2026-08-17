---
status: stable
owner: design
last-updated: 2025-07-11
---

# 动效与交互设计规范

## 总则：动效是杂志的呼吸，不是装饰

ReZenKi 是黑白简约杂志风。**动画必须服务于"克制、从容、留白"的气质**——它让页面像一本翻动缓慢的纸质杂志，而不是霓虹灯广告牌。

- ✅ 允许：淡入、位移、轻缩放、缓动、弹性（克制的）、毛玻璃（黑白灰）、骨架屏、打字机（Hero 副标题）
- ❌ 禁止：粒子系统、着色器、故障效果、彩色辉光、3D 透视、拖拽、无限循环动画（全部违反黑白克制，属于"创意库存在但本项目禁用"）

## 技术栈与参考源

| 来源 | 用途 | 本项目落地 |
|------|------|-----------|
| [Framer Motion / motion.dev](https://motion.dev/docs/react) | 动画引擎（包名 `motion`，`import { motion } from "motion/react"`） | 页面进入动画、Hero 序列、卡片交互 |
| [shadcn/ui](https://ui.shadcn.com/docs/installation) | 无头组件库模式参考 | 组件 API 设计（Radix + cva + tailwind-merge 思路），**不直接安装** |
| [Animate.css](https://animate.style/) | 动画效果理念参考 | fadeIn/slideUp 等经典缓动的命名与曲线 |
| [Apple Hello Effect](https://chanhdai.com/components/apple-hello-effect) | 首屏文字序列动画 | Hero 花体标题的逐字浮现（stagger） |

## 动画分类与落地

### 运动类

| 效果 | 落地 | 参数约束 |
|------|------|----------|
| 位移 | 卡片进入视口上移 12px；Hero 副标题上移 8px | 位移 ≤ 16px（大位移是广告气质） |
| 缩放 | Hero 花体字 0.96 → 1 浮现 | 缩放范围 0.9-1.0 |
| 旋转 | Logo 悬停微旋转 2° | ≤ 3° |
| 弹性 | Hero 花体字 settle 弹一下（spring） | spring: { stiffness: 120, damping: 16 } |
| 缓动 | 所有进入动画 | ease: [0.22, 1, 0.36, 1]（easeOutQuint 风格，慢出） |

### 视觉类

| 效果 | 落地 | 参数约束 |
|------|------|----------|
| 淡入 | 所有区块进入视口 | opacity 0 → 1，时长 0.6-1.0s |
| 毛玻璃 | header 滚动后 backdrop-blur | blur(8px) + 半透明白（`bg-paper/70`），仅 header |
| 模糊 | 过渡中的内容淡入时轻微 blur(4px) → 0 | 仅 Hero 使用，正文不用 |
| 阴影 | 卡片 hover 时 `shadow-sm` | 杂志风阴影弱化，不用大阴影 |

### 交互类

| 效果 | 落地 | 参数约束 |
|------|------|----------|
| 水波纹 | 按钮点击 | 白描边按钮上用 scale 波纹（client 组件），保持单色 |
| 悬停 | 卡片、链接 | 位移 2px / 透明度变化，150ms transition |
| 滚动视差 | Hero 花体字随滚动轻微上移淡出 | 位移 ≤ 24px，`useScroll` + `useTransform` |
| 骨架屏 | 已在 loading 规范中 | 见 `loading-and-error-states.md` |

### 文字类

| 效果 | 落地 |
|------|------|
| 打字机 | Hero 副标题 "REFRAINZEN AND KIKI"（client hook，每字 40ms，仅一次） |
| 拆字 | Hero 花体 "ReZenKi" 逐字 stagger 浮现（Apple Hello Effect 思路） |
| 波浪字 | 禁用（装饰性过强） |
| 描边 | 文章标题 hover 下划线动画（`background-size` 过渡） |

### ⚠️ Mermaid 渲染踩坑（v0.7.1 记录）

1. **`themeVariables` 不能传 CSS 变量字符串**（`var(--color-code)`）——mermaid 颜色解析器直接抛 `Unsupported color format`，且该错误在 useEffect 中会拖垮整个客户端渲染树（React 卸载）。**也不能传 oklch**（内部读 `.h` 崩）。正确做法：按 `.dark` class 选一套 **hex 字面量**（与 token 视觉等价的近似值）。
2. **`mermaid.render(id, source)` 的 DOM 插入不可靠**（svg 有时不进目标元素）——直接用返回值写 `pre.innerHTML = svg`，不要依赖 `getElementById`。
3. 渲染器整体 try/catch + 单图失败写入占位（不抛异常）。

## 组件实现约束

1. **Server/Client 边界**：motion 是客户端库。动画组件必须是独立 Client 组件（如 `src/components/motion/fade-in.tsx`），Server Component 保持零客户端 JS。**禁止**为动画给整个页面标 `'use client'`。
2. **进入视口动画**：用 `whileInView` + `viewport={{ once: true, margin: "-80px" }}`——只播一次，避免滚动反复触发。
3. **stagger 序列**：Hero 等序列动画用 `variants` + `staggerChildren`，间隔 60-90ms。
4. **SSR 安全**：首屏动画初始状态即最终状态（`initial={false}` 或 SSR 友好模式），避免闪烁（FOUC）。
5. **reduced-motion**：`motion` 自动尊重 `prefers-reduced-motion`（MotionConfig reducedMotion="user"）；CSS 动画已有 globals.css 全局降级。

## 反例

- ❌ 给整页加粒子背景——违反黑白克制，且 60fps 代价换不来杂志感
- ❌ 卡片 hover 放大 1.1 + 彩色阴影——广告牌风格
- ❌ 无限旋转加载图标——杂志风用静态"加载中…"文字或骨架屏
- ❌ 把 motion 组件塞进 Server Component import——直接编译报错，必须拆 Client 组件

## 与现有规范的关系

- 色彩约束见 `visual-style-guide.md`（动画中出现的任何颜色都必须来自黑白灰 token 集）
- 骨架屏规范见 `loading-and-error-states.md`
- 动效引入的新交互必须通过 `responsive-and-a11y.md` 的无障碍检查

## 首页场景化（v0.8.0 / v0.11.0 两次尝试均回滚）

场景化首页（流体/3D 轮播/叠层/snap）两次实现均被用户回滚（v0.8.1、v0.11.1）。**最终形态：经典单页流——3D 波浪 Hero（v0.10.x 保留，用户认可）+ 向下滚动文章列表**。禁止再引入多屏 snap/3D 轮播/叠层场景结构。
