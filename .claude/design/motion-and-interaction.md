---
status: stable
owner: design
last-updated: 2026-08-22
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
| 鼠标视差 | Hero 舞台（v0.21.3）：normalized -1..1 + lerp 0.06，背景 ±8/6 · 主图 ±18/12（+rotateY ±1.5°/rotateX ±1°）· 主图内层反向 ±6/4 · 前景标题 ±28/20；鼠标离开回中心 | 仅桌面 pointermove；rAF 循环**收敛即停**（目标 0 且稳定 → 停循环，移动时重启）；reduced-motion 全部归零 |
| 滚动视差 | Hero 舞台随滚动轻微上移淡出（滚出转场，属例外区白名单） | 位移 ≤ 60px；驱动源为共享滚动源 `scroll-source.ts`（首页为局部滚动容器，window 不滚动——`useScroll` 监听 window 无效，D8 教训） |
| 底栏显隐 | 文章/归档/关于页的浮动底栏（`site-footer.tsx`）：**下滚出现、上滚隐藏**；顶部恒隐藏、底部恒显示、内容短于一屏恒显 | fade + 位移 16px（≤16px 约束内），0.35s，ease `[0.22, 1, 0.36, 1]`；阈值 6px 防抖动；reduced-motion 位移归零仅淡入；底栏无交互元素，`pointer-events-none` |
| 圆环径向开屏 | 音乐页（v0.23.0）：点击导航栏 Disc3 图标 → 音乐全屏 overlay 以**图标为圆心** `clip-path: circle(r at 图标x y)` 半径向外扩张（0.65s）——圆内逐步露出音乐页内容（旧页面仍在圆外可见），直至覆盖全屏；「再点图标」同一圆反向缩小收回，回到上一页（overlay 非路由，旧页面始终挂载，滚动位置保留） | 仅音乐 overlay 使用；1px line 圆环随半径同步（纸面同色须描边才可见），覆盖完成即消失；reduced-motion 直接切换无动画；半径状态全在 rAF/定时器回调内（react-hooks set-state-in-effect 门禁） |
| 骨架屏 | 已在 loading 规范中 | 见 `loading-and-error-states.md` |

### 文字类

| 效果 | 落地 |
|------|------|
| 行入场 | Hero 主/副标题两行 overflow-hidden + translateY(110%)→0 + opacity，行间延迟 0.12s（0.08~0.15 区间），cubic-bezier(0.22,1,0.36,1) 无弹跳（v0.21.3，替代逐字拆字） |
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
- **R4 motion 数字源陷阱（2026-08-20，v0.21.0 补丁修复）**：`useSpring(number)` 只取挂载时初值、**不追踪后续 render 的数字变化**；无源的 `useTransform(() => n)` 同样不响应变化——首版共享滚动源驱动的卡片进/出场曾因此**永远停在初始态**（卡片 opacity 恒 0、transform 恒 75px，图片"网络正常但看不见"）。→ **滚动驱动的 motion 值必须走 `useMotionValue` + effect 同步源（`mv.set(v)`），spring/transform 订阅 MotionValue**；无源 `useTransform(fn)` 禁用，多源组合用 `useTransform([a, b], ([a, b]) => …)`。

### 章节式长滚动叙事（v0.21.0，2026-08-20 用户要求）

- **当前形态（以代码为准）**：`src/app/page.tsx` → `HomeScenes`：线性纵向四章——Ch.00 序（档案图视差舞台 Hero）→ Ch.01 最近（逐卡翻页，每卡一屏）→ Ch.02 档案（年份分组时间轴）→ Ch.03 落款；局部滚动容器（`data-scroll-container`）+ 右侧竖向进度指示 + 章节菜单（`nav`/`button`/`aria-current`）。
- **wheel 平滑翻页（2026-08-20 用户要求"转场不顿挫、2~3s"；同日两轮灵敏度调校）**：滚轮/触控板接管（preventDefault + easeInOut 2s rAF 动画滚到相邻锚点）。**灵敏度阻尼三层**：① 空闲态累积 deltaY ≥ **180px** 才翻页（约两格标准滚轮；经历 120 太灵 → 260 太慢 → 取中间 180；deltaMode 换算 line×40 / page×400）；② 动画中累积 ≥ **420px** 才中断直跳（快速连翻仍可达）；③ 动画结束后 **550ms 冷却期**忽略惯性尾巴（防触控板连翻）。锚点 = Hero/4 卡等高页 + 各章顶（getBoundingClientRect 动态算，档案章超高兼容）。触摸设备/滚动条拖拽保持原生滚动，reduced-motion 直跳。**快照历史：无 wheel 接管时 snap-mandatory 逐页捕捉（Chrome 过渡 ~300ms），scroll 驱动动效被压缩且 spring 滞后 → 一顿一顿。**
- **滚动驱动动效（2026-08-20，v0.21.0，wheel 2s 翻页提供时长）**：卡片进出场 45° **对称幅度**——进入从右下 +920px/+10° 滑入、滚出向左上 -920px/-10° 飞出（2026-08-20 用户要求入场幅度与出场相当，原 75px 太小）；档案章帖子**从右往左滑入**（x 48→0 + 淡入，stagger 错峰）、退场**原路返回**（x 0→48 向右，倒序），章题/年份头纯淡入淡出；落款为**签名式入场**（SVG 花体手写描画 draw-stroke 2.4s + 墨色渐入 → 墨线展开 → © 行 → 链接行错峰浮现，总约 3s，current 触发）；档案/落款章各配 **Wellcome 蚀刻局部背景**（multiply 水印式底纹，dark 反转 screen）。全部双向可逆（滚动即时间轴），`prefers-reduced-motion` 下位移/旋转/缩放关闭仅保留淡入（JS matchMedia，CSS 全局降级无效——D4 教训）。
- **R5 动效性能纪律（2026-08-20）**：① 滚动驱动动效一律**纯函数映射**（去 useSpring——弹簧滞后于滚动）；② 常驻动画必须**收敛即停**——Hero 鼠标视差的 rAF 循环在目标归零且稳定时停止、移动时重启（无谓循环烧 CPU；前车之鉴：three.js 波浪 render loop 在无 GPU 环境实测吃满主线程 2fps，已随 wave-ocean.tsx 删除）；③ WebGL 除非必要不引入（v0.21.3 用户否决 3D 水波纹，视差改用 CSS transform + motion，效果等同且零 GPU 负担）。
- **实现纪律**：四步增量（骨架 → 指示器 → 档案章 → 转场），每步独立 commit 独立验收；转场动效最后做且必须随 `prefers-reduced-motion` 降级（JS `matchMedia` 判断，CSS 全局降级对 JS 驱动的 transform 无效——D4 教训）。

> **Hero 演进（v0.21.3，2026-08-20）**：3D 水波纹（wave-ocean.tsx，Three.js）已被用户否决删除——"数字生成物与档案气质张力"的悬置项结案：Ch.00 改为**档案图视差舞台**（伊甸园蚀刻主图 + 衬线大标题 + 鼠标惯性视差 + SCROLL TO EXPLORE），既符合档案馆气质又保留交互感。见 `DESIGN.md` §5。
