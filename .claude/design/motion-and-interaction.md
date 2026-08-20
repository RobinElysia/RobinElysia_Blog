---
status: stable
owner: design
last-updated: 2026-08-20
---

# 动效与交互设计规范

## 总则：动效是纸页翻动的呼吸，不是装饰

ReZenKi 是简约复古艺术风（档案馆气质）。**动画必须服务于"克制、从容、留白"的气质**——它让页面像一本翻动缓慢的图录，而不是霓虹灯广告牌。

- ✅ 允许：淡入、位移、轻缩放、缓动、弹性（克制的）、毛玻璃（暖纸 token）、骨架屏、打字机（Hero 副标题）
- ❌ 禁止：粒子系统、着色器、故障效果、彩色辉光、3D 透视、拖拽、无限循环动画（全部违反克制原则，属于"创意库存在但本项目禁用"）
- ❌ **禁止做旧特效**：胶片颗粒、划痕、闪烁、泛黄叠层、老电影抖动。**复古感来自纸色、衬线、真实藏品，不来自滤镜**——加滤镜是伪复古。
- ⚠️ **纸质纹理例外**：允许极轻的**静态**纸纹（noise ≤ 3% 透明度、纯灰度、CSS 或内联 SVG 生成，不加载位图）。动态纹理禁止。

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

> **⚠️ 叙事转场例外区（2026-08-20 起，修 D11）**：以上 ≤16px/≤3° 约束**不适用于首页章节转场**——逐卡翻页（`scene-carousel.tsx`）与章节叙事转场允许大位移（±920px 级）与旋转（≤10°）。例外**白名单限定 `src/components/home/**`**（Hero、逐卡翻页、章节转场、进度指示器），白名单外任何组件出现大位移仍属违规。此例外不豁免 reduced-motion 义务——`prefers-reduced-motion: reduce` 下章节转场必须关闭位移/旋转，只保留淡入与 snap。

### 视觉类

| 效果 | 落地 | 参数约束 |
|------|------|----------|
| 淡入 | 所有区块进入视口 | opacity 0 → 1，时长 0.6-1.0s |
| 毛玻璃 | header 滚动后 backdrop-blur | blur(8px) + 半透明白（`bg-paper/70`），仅 header |
| 模糊 | 过渡中的内容淡入时轻微 blur(4px) → 0 | 仅 Hero 使用，正文不用 |
| 阴影 | 卡片 hover 时 `shadow-sm` | 图录风阴影弱化，不用大阴影 |

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

- ❌ 给整页加粒子背景——违反克制原则，且 60fps 代价换不来图录感
- ❌ 卡片 hover 放大 1.1 + 彩色阴影——广告牌风格
- ❌ 无限旋转加载图标——图录风用静态"加载中…"文字或骨架屏
- ❌ 把 motion 组件塞进 Server Component import——直接编译报错，必须拆 Client 组件

## 与现有规范的关系

- 风格上位约束见根目录 `DESIGN.md` §5（做旧特效禁令、纸纹例外、首页形态事实记录）
- 色彩约束见 `visual-style-guide.md`（动画中出现的任何颜色都必须来自暖纸 token 集）
- 骨架屏规范见 `loading-and-error-states.md`
- 动效引入的新交互必须通过 `responsive-and-a11y.md` 的无障碍检查

## 首页场景化（历史演进：v0.8.0 / v0.11.0 两次回滚，v0.12.0 起重新引入并保留）

- **v0.8.0**：首次场景化（流体 Hero + 3D 轮播 + 叠层 + snap）——**v0.8.1 用户回滚**。
- **v0.11.0**：再次场景化（3D 环形轮播 + 叠层转场 + snap）——**v0.11.1 用户再次回滚**。
- **v0.12.0 起**：用户再次要求重建场景化首页，**保留至今**并持续演进（v0.13 逐卡翻页 45° 进出场 → v0.14 16:9 纯图卡 + 左下信息区 → v0.15 修复逐卡翻页 → v0.16 慢速吸附（后恢复原生快吸附）+ 水波纹慢速惯性 → v0.17 卡片出入场 spring 慢速大位移）。

### 两次回滚的根因（R1/R2/R3 —— 章节叙事必须遵守的纪律）

- **R1 打包交付**：v0.8.0 一次上 4 个机制、v0.11.0 一次上 3 个，用户只能整体判断好坏，无法定位不满意的部分，只能整体回滚；v0.12 后每版只动一个变量，每一步都被单独接受。→ **任何首页结构变更拆成独立可回滚的小步，转场永远最后做。**
- **R2 环形隐喻**：两次被砍的核心都是 3D 环形轮播——"下一篇在哪"没有方向答案，位置感丢失；保留至今的逐卡翻页是线性纵向隐喻。→ **章节叙事必须严格线性纵向；禁止环形/轨道/3D 空间轮播、禁止 sticky 叠层覆盖。** 竖向进度指示是加分项（强化位置感），与失败方案方向相反。
- **R3 推翻已认可成果**：v0.8.0 用流体 Hero 替换了已认可的 Hero，v0.11.0 用轮播替换了"向下滚动看文章"的直觉。→ **不重写已认可组件，章节层只在其外部包壳。** Hero 与逐卡翻页原样保留，分别作为 Ch.00 与 Ch.01。

### 章节式长滚动叙事（v0.21.0，2026-08-20 用户要求）

- **当前形态（以代码为准）**：`src/app/page.tsx` → `HomeScenes`：线性纵向四章——Ch.00 序（3D 波浪 Hero）→ Ch.01 最近（逐卡翻页，每卡一屏）→ Ch.02 档案（年份分组时间轴）→ Ch.03 落款；局部滚动容器（`data-scroll-container`，`snap-y snap-mandatory`）+ 右侧竖向进度指示 + 章节菜单（`nav`/`button`/`aria-current`）。
- **实现纪律**：四步增量（骨架 → 指示器 → 档案章 → 转场），每步独立 commit 独立验收；转场动效最后做且必须随 `prefers-reduced-motion` 降级（JS `matchMedia` 判断，CSS 全局降级对 JS 驱动的 transform 无效——D4 教训）。

> ⚠️ **3D 波浪 Hero 与档案馆定位的张力（待决）**：`wave-ocean.tsx` 的 Three.js 水面是数字生成物，不是档案物，与简约复古艺术风存在气质张力。但它是 v0.10.x 起获用户认可的成果，**不擅自推翻**——是否替换为静态藏品图 Hero 属独立决策，需单独确认。见 `DESIGN.md` §5。
