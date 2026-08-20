---
status: stable
owner: design
implementation-status: in-progress  # token/字体已落地代码（2026-08-20）；图像规范（档案图）落地中
last-updated: 2026-08-20
---

# DESIGN.md — 简约复古艺术风视觉总纲

> **本文件是设计总纲**，定义"为什么这样设计"和"设计的边界在哪"。
> 落地细则在 `.claude/design/` 四份文档中，本文件不重复它们的内容，只定义它们必须遵守的上位约束。
>
> | 本文件负责 | `.claude/design/` 负责 |
> |-----------|----------------------|
> | 风格定位、色彩/字体决策及其理由 | Token 表、字号阶梯、代码块/公式写法（`visual-style-guide.md`） |
> | 图像作为一等公民的原则、档案图取用流程 | 页面骨架、容器宽度（`layout-patterns.md`） |
> | 动效的风格边界 | 动画参数表、禁用清单、Client 边界（`motion-and-interaction.md`） |
> | 无障碍的设计前提 | 断点、WCAG 检查项、键盘导航（`responsive-and-a11y.md`） |

---

## 1. 风格定位

**ReZenKi 是一本"档案馆气质"的个人博客——简约复古艺术风。**

一句话判据：**页面读起来应该像一份被精心排版的博物馆图录，而不是一个技术博客模板。**

### 三个支柱

| 支柱 | 含义 | 反例 |
|------|------|------|
| **纸感** | 底色是做旧纸张而非纯白，墨色是暖黑而非纯黑 | `#fff` 背景 + `#000` 文字的屏幕感 |
| **档案感** | 图像来自真实的公共领域藏品，带出处、年代、馆藏方 | 随机风景图 API、AI 生图、Unsplash 通用摄影 |
| **克制** | UI 自身几乎不发声，所有视觉浓度由藏品图承担 | 彩色按钮、渐变色块、装饰性插画 |

### 参考坐标：Getty "Tracing Art"

[getty.edu/tracingart](https://www.getty.edu/tracingart/)（Getty × Resn，Awwwards SOTD 2025-07-22，评分 7.68）。

**我们借鉴的是它的取舍逻辑，不是它的形态：**

- ✅ **UI 近乎双色**——该站被 Awwwards 提取出的调色板只有 `#FFFFFF` + `#DAE2E8` 两色，但整站观感"colorful"。**颜色全部来自藏品图本身，UI 一滴不出。** 这是本项目色彩规范的直接来源（见 §2）。
- ✅ **大幅档案图 + 强留白**——图像是内容不是配图。
- ✅ **元数据即排版元素**——年代、馆藏、编号以小字宽字距呈现，本身构成版面节奏。
- ✅ **章节幕叙事 + 竖向进度条**（2026-08-20 决策反转，此前标注"不借鉴"）：采纳其滚动叙事骨架——首页为多章节长页（Ch.00 序 → Ch.01 最近 → Ch.02 档案 → Ch.03 落款），滚动驱动转场，右侧竖向进度指示 + 章节菜单强化位置感。**但有两道明确边界**：① **禁止环形 3D 轮播与叠层转场**——两者正是 v0.8.1、v0.11.1 两次被整体回滚的核心（无方向答案、破坏线性位置感），回滚根因已固化为规范（见 `.claude/design/motion-and-interaction.md` 末节 R1/R2/R3）；② **不接受其可用性折价**（见下条）——章节导航必须键盘可达、焦点可见、reduced-motion 下降级。
- ⚠️ **该站的可用性是其最弱项**（Usability 7.25，Accessibility 7.40，为全站最低分）。这是重动效叙事站点的典型代价——**本项目不接受这个代价**，无障碍要求见 §6。

---

## 2. 色彩：暖纸色调 + 藏品图供色

### 决策

**UI 底色从纯白/纯黑改为做旧纸色/暖墨色；UI 自身仍不使用任何品牌强调色——全站色彩来自藏品图。**

这是对原「全站禁止黑白灰以外的颜色」硬约束的**一次收窄式修订**，不是放宽：

- **放宽的部分**：允许极低彩度的暖色偏移（chroma ≤ 0.015），使白变纸、黑变墨。
- **收紧的部分**：明确"藏品图是唯一的色彩来源"。原规范只说"禁止彩色"，未说明视觉浓度从哪来，导致实践中靠随机风景图填充。

> **为什么不引入复古强调色（朱砂红/普鲁士蓝）？**
> 一旦 UI 有了自己的强调色，它就会和藏品图的固有色抢戏——Getty 的做法恰恰证明了双色 UI 反而让藏品更"colorful"。保留此选项为未来 ADR 议题，当前不采用。

### Token 值

以下值已实算 WCAG 2.1 对比度（sRGB 转换 + 相对亮度），**全部通过 AA**：

**白模式（默认）**

| Token | oklch | ≈hex | 用途 |
|-------|-------|------|------|
| `--color-ink` | `oklch(0.22 0.015 60)` | `#201914` | 正文/标题（暖墨黑） |
| `--color-paper` | `oklch(0.97 0.012 85)` | `#f9f5ec` | 页面背景（做旧纸） |
| `--color-muted` | `oklch(0.50 0.015 70)` | `#69625a` | 辅助文字（暖灰） |
| `--color-line` | `oklch(0.87 0.015 80)` | `#d9d3c9` | 分割线/边框 |
| `--color-code` | `oklch(0.94 0.014 85)` | `#efebe1` | 代码块/卡片底 |

**黑模式（`.dark`）**

| Token | oklch | ≈hex | 用途 |
|-------|-------|------|------|
| `--color-ink` | `oklch(0.91 0.012 85)` | `#e5e1d9` | 正文/标题（暖白） |
| `--color-paper` | `oklch(0.18 0.012 60)` | `#16100c` | 页面背景（深褐墨） |
| `--color-muted` | `oklch(0.68 0.012 75)` | `#9d9790` | 辅助文字 |
| `--color-line` | `oklch(0.32 0.014 65)` | `#38312b` | 分割线/边框 |
| `--color-code` | `oklch(0.23 0.012 60)` | `#211c17` | 代码块/卡片底 |

**实测对比度**

| 组合 | 白模式 | 黑模式 | 要求 |
|------|--------|--------|------|
| ink / paper | 15.91 | 14.41 | ≥ 4.5 ✅ |
| muted / paper | 5.51 | 6.53 | ≥ 4.5 ✅ |
| ink / code | 14.55 | 12.95 | ≥ 4.5 ✅ |
| muted / code | 5.04 | 5.87 | ≥ 4.5 ✅ |
| line / paper | 1.36 | 1.48 | 装饰性，无下限 |

> `line` 是纯装饰边框，不承载文字，WCAG 对其无对比度要求。但它必须在两种模式下肉眼可辨——当前值满足。

### 硬约束（不变）

1. **组件禁止硬编码色值**——只允许 `ink / paper / muted / line / code` 五个 token。`bg-white`、`text-black`、`#fff`、`bg-gray-*`、`bg-amber-50` 一律禁止。
2. **UI 元素不得引入 token 之外的颜色**——链接用下划线 + ink，按钮用边框 + ink，标签用边框 + muted。
3. **彩度上限 chroma ≤ 0.015**——任何新 token 超过此值即违反"纸感而非彩色"的定位。
4. **危险色例外**：删除等破坏性操作可用红色，但必须先写 ADR 说明，并同时提供亮/暗两套值。

### 藏品图的色彩处理

- **默认不做去饱和/褐调滤镜**——藏品图本身已带年代感，加滤镜是伪复古。
- **允许的处理**：`object-cover` 裁切、纸色底衬（`bg-code`）、1px `border-line` 描边、底部 `from-paper/80` 渐变遮罩（保证叠字可读）。
- **禁止**：彩色叠层、混合模式炫技、饱和度拉满、圆角 ≥ 8px（图录是方的）。

---

## 3. 字体：衬线正文 + 花体 Logo

### 决策

**正文与标题从 Inter 无衬线改为复古感衬线；Italianno 花体保留作 Logo。**

理由：博物馆图录、艺术出版物的正文几乎无一例外是衬线体。无衬线正文与"档案馆气质"存在气质断层——这是原 `visual-style-guide.md` 已标注为"待设计评审"的悬置项，本次结案。

### 字体角色表

| Token | 字体 | 角色 | 说明 |
|-------|------|------|------|
| `--font-script` | **Italianno** | Logo / 首页 Hero 大字 | 保留，呼应品牌名花体手写感 |
| `--font-serif` | **EB Garamond** | 文章标题 + 正文 | 16 世纪 Garamond 的开源复刻，博物馆图录标准选择；有真斜体和小型大写 |
| `--font-sans` | 系统栈 | UI 控件、Dashboard、表单 | 后台不需要复古感，保持中性高效 |

**为什么是 EB Garamond：**

- 开源（OFL）、`next/font/google` 直接可用，与现有加载方式一致
- 真正的旧样式（old-style）字形，与 15–19 世纪藏品图同时代
- 拉丁字符集完整，含小型大写变体——适合做元数据标签
- 备选：Cormorant Garamond（更纤细，标题好看但正文偏轻）、Libre Baskerville（更粗壮，屏幕可读性更好但年代感偏晚）

**中文字体**：EB Garamond 无中文字形。中文正文回退到系统衬线栈（`Songti SC` / `SimSun` / `Noto Serif SC`），需在 `--font-serif` 的 fallback 链中显式声明，否则中文会掉到无衬线，与英文正文割裂。

### 字重与排版气质

- 正文 400，标题 500–600。**禁止 700+**——图录不吼。
- 元数据（年代、馆藏、编号、日期）使用 `text-xs tracking-[0.35em] uppercase` + `muted`——这是 Getty 式的版面节奏来源，也是本项目已有的做法，继续保留并扩大使用。
- 正文行高 1.75，阅读宽度上限 `max-w-3xl`（已有约束，不变）。

---

## 4. 图像：档案图作为一等公民

### 现状问题（必须修复）

`src/components/home/post-card.tsx:13` 当前使用 `https://picapi.pai.al/api/scenery.php` 随机风景图 API 作为文章卡片配图。这与本设计定位**直接冲突**：

- 随机风景照没有出处、没有年代、没有作者——是"库存图"而非"档案图"
- 每次刷新图片都变，文章与图像无语义关联
- 第三方接口不可控（可用性、版权、隐私均无保证）

**替换方案**：改用 `archival-imagery-mcp` 取得的公共领域藏品图，落盘到 `public/archive/`，与文章建立稳定关联。

### 图像取用流程（archival-imagery-mcp）

**MCP 包信息**（已核验，非推测）：

- npm: `archival-imagery-mcp@0.2.1`（2026-05-23 发布，MIT，作者 Harpreet Chandhoke）
- 12 个工具，覆盖 5 个开放版权来源
- 仅一个依赖（`@modelcontextprotocol/sdk`），无遥测，无持久状态

**来源与版权默认值**

| 来源 | 覆盖 | API Key | 版权默认 |
|------|------|---------|----------|
| **Wellcome Collection** | 英国。医学、科学、星象、神秘学史，~25 万件 | 免 | CC-BY / PDM |
| **Met Museum** | 美国。~47 万件，默认过滤 `hasImages` + `isPublicDomain` | 免 | CC0 |
| **Library of Congress** | 美国。照片、手稿、地图、版画、报纸、影片 | 免 | 多为 PD |
| **Smithsonian Open Access** | 美国。21 家博物馆 450 万+ 件，默认仅 CC0 | 需（免费） | CC0 |
| **Europeana** | 欧盟聚合器。大英图书馆、卢浮宫、**全量 Rijksmuseum**、4000+ 机构 | 需（免费） | 混合（可过滤） |

> Rijksmuseum 官方 REST API 已于 2024 年废弃转向 OAI-PMH，该 MCP 有意不直接支持，**通过 `europeana_search` 传 `provider="Rijksmuseum"` 取用**。

**工具调用三段式**

```
1. 检索：wellcome_search / met_search / loc_search / smithsonian_search / europeana_search
2. 取详情：*_get_work / *_get_object / *_get_item / *_get_record  → 拿到全尺寸图 URL + 元数据 + license
3. 落盘：download_image { url, savePath: "<绝对路径>/public/archive/xxx.jpg" }
```

`wellcome_image_url` 是额外的工具函数，可按 IIIF Image API 规格构造任意尺寸（`'1200,'`、`',900'`、`'full'`）。

**配置**（`~/.claude.json`，key 全部可选——Wellcome / Met / LoC 免 key）：

```json
{
  "mcpServers": {
    "archival-imagery": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "archival-imagery-mcp"],
      "env": {
        "SMITHSONIAN_API_KEY": "",
        "EUROPEANA_API_KEY": ""
      }
    }
  }
}
```

> Key 申请：Smithsonian → [api.data.gov/signup](https://api.data.gov/signup/)；Europeana → [pro.europeana.eu/page/get-api](https://pro.europeana.eu/page/get-api)。均免费、2 分钟内完成。缺 key 时对应工具返回带注册地址的错误提示，不影响其余工具。

### 选图准则

1. **优先 CC0 / PDM**——无署名义务，风险最低。CC-BY 可用但必须带署名（见下）。
2. **优先版画、蚀刻、手稿、植物/天文图谱、地图**——线条与纸色调与本站气质同源；油画照片色彩浓度过高，仅在确有语义关联时使用。
3. **图与文必须有语义关联**——写并发写死锁配一张 16 世纪迷宫版画是好的；配一张随机静物是坏的。
4. **一篇文章一张定图**，不随刷新变化。图与 slug 绑定。

### 落盘与元数据

- 路径：`public/archive/<slug>-<source>-<id>.jpg`
- 每张图必须记录：`title` / `creator` / `date` / `source` / `sourceUrl` / `license`
- 元数据随图展示（小字 + 宽字距 + muted），**这是版面的一部分，不是免责声明**

### 署名格式

CC-BY 项目必须署名，CC0 / PDM 无义务但仍署名（档案感的一部分）：

```
Willem Kalf, *Still Life*, c. 1662 — Rijksmuseum via Europeana (CC0)
```

> ⚠️ **每一条 license 以工具返回的实际值为准**。上表是各来源的默认倾向，不是逐条保证——Europeana 尤其混合，务必逐项检查 `onlyOpen` 过滤后的实际 license 字段。

### 技术约束

- 本地图走 `next/image`（`next.config.ts` 已配置 AVIF/WebP 输出），**不再用 `<img>` + eslint-disable**
- 必须给 `width` / `height`，避免 CLS
- 首屏图 `priority`，其余 `loading="lazy"`
- `alt` 写藏品标题而非"文章配图"——对屏幕阅读器有真实信息量

---

## 5. 动效边界

动效参数表在 `.claude/design/motion-and-interaction.md`，本节只定义**风格上位约束**：

- **总则不变**：动效是纸页翻动的呼吸，不是霓虹灯。位移 ≤ 16px，缓动慢出，尊重 `prefers-reduced-motion`。
- **新增禁令**：不得为"复古"引入做旧特效——胶片颗粒、划痕、闪烁、泛黄叠层、老电影抖动**全部禁用**。复古感来自纸色、衬线、真实藏品，不来自滤镜。
- **纸质纹理**：允许极轻的静态纸纹（noise ≤ 3% 透明度，纯灰度，CSS 生成或内联 SVG，不加载位图）。**动态纹理禁止**。
- **首页结构（章节式长滚动叙事，2026-08-20 用户要求）**：线性纵向四章——**Ch.00 序**（全屏 3D 波浪 Hero，原样保留）→ **Ch.01 最近**（逐卡翻页，原样保留）→ **Ch.02 档案**（按年份分组的藏品图时间轴，档案元数据即排版元素）→ **Ch.03 落款**（花体签名 + 墨线 + 署名导航）。右侧竖向进度指示 + 章节菜单（`nav`/`button`/`aria-current`）。**滚动驱动动效**：档案章题/年份头/文章依次从左滑入（stagger），滚向落款时整章向视口中心收缩淡出；落款为签名式入场（签名落笔回正 → 墨线展开 → 文字行浮现），全部双向可逆、随 `prefers-reduced-motion` 降级为纯淡入。**演进纪律（防回滚，来自 v0.8.1/v0.11.1 两次整体回滚的根因）**：每一步增量独立可回滚、严格线性纵向、不推翻已认可成果；转场动效永远最后做，且必须随 `prefers-reduced-motion` 降级。实现细节见 `.claude/design/motion-and-interaction.md` 末节。
- **既有 3D 波浪 Hero（`wave-ocean.tsx`）**：v0.10.x 保留且用户认可。**但它与档案馆定位存在张力**——Three.js 水面是数字生成物，不是档案物。是否替换为静态藏品图 Hero 属独立决策，需单独确认，本文件不擅自推翻。

---

## 6. 无障碍前提

细则在 `.claude/design/responsive-and-a11y.md`。本节定义复古风带来的**额外风险点**：

1. **暖色低彩度不得侵蚀对比度**——§2 的实测值是准入线。任何新 token 必须同样实算 AA，不能凭"看起来够深"下结论。
2. **衬线体的小字号风险**——EB Garamond 的 x-height 低于 Inter，同字号下观感更小。正文最小 `text-base`（1rem），元数据小字必须靠 `tracking` 和 `uppercase` 保证辨识度，**不得低于 `text-xs`（0.75rem）**。
3. **藏品图上的叠字**——图像亮度不可控，叠字必须有渐变遮罩或实底衬托，不可裸叠。
4. **`alt` 必须有信息量**——见 §4。
5. **不接受 Getty 式的可用性折价**——参考站 Usability 7.25 / Accessibility 7.40 是重动效叙事的代价，本项目以 WCAG 2.1 AA 为硬底线。

---

## 7. 落地检查清单

新组件 / 新页面提交前逐条核对：

- [ ] 只用了 `ink / paper / muted / line / code` 五个 token，无硬编码色值
- [ ] 白模式和黑模式各看过一遍
- [ ] 正文/标题用衬线（`--font-serif`），中文有衬线回退
- [ ] 字重 ≤ 600
- [ ] 图像是档案图，不是随机图/AI 图/库存图
- [ ] 图像有 `width`/`height`、有信息量的 `alt`、正确的 license 署名
- [ ] 元数据以 `text-xs tracking-[0.35em] uppercase text-muted` 呈现
- [ ] 无做旧滤镜、无动态纹理、无彩色叠层
- [ ] 动效位移 ≤ 16px（叙事转场例外仅限 `src/components/home/**`，见 motion-and-interaction.md），`prefers-reduced-motion` 下降级
- [ ] 键盘可达 + 焦点可见

---

## 8. 待办（本文件定义方向，实现另行排期）

以下为本次设计修订**尚未落地到代码**的部分，按依赖顺序：

| # | 事项 | 涉及文件 |
|---|------|---------|
| 1 | 替换 `globals.css` 的 10 个 token 值为 §2 暖纸色调 | `src/app/globals.css` |
| 2 | `layout.tsx` 引入 EB Garamond，配置 `--font-serif` 及中文回退链 | `src/app/layout.tsx`、`globals.css` |
| 3 | 正文/标题从 `font-sans` 切到 `font-serif`，Dashboard 保持 sans | 各页面 + `mdx-components.tsx` |
| 4 | 配置 `archival-imagery` MCP，选定首批藏品图落盘 `public/archive/` | `~/.claude.json`、`public/archive/` |
| 5 | `PostCard` 移除 `picapi.pai.al`，改 `next/image` + 本地档案图 + 元数据署名 | `src/components/home/post-card.tsx` |
| 6 | 藏品元数据的存储方案——**已决（2026-08-20）**：静态映射文件 `src/lib/archive-images.ts`（slug → title/creator/date/source/sourceUrl/license/路径），不动 DB（posts.cover_image 保留为可选覆盖字段） | `src/lib/archive-images.ts` |
| 7 | 同步 `.claude/design/` 四份文档 + `INDEX.md` 登记本文件 | `.claude/**` |
| 8 | 首页章节容器（Chapter 语义组件 + `--header-h` 变量，消除 57px 魔法数；单一滚动源） | `src/components/home/**` |
| 9 | 竖向进度指示 + 章节菜单（nav/button/aria-current，键盘可达） | `src/components/home/**` |
| 10 | Ch.02 档案章：年份分组时间轴（档案元数据小字宽字距） | `src/components/home/**` |
| 11 | 章节转场动效 + reduced-motion 降级（最后实现，防回滚纪律） | `src/components/home/**` |

> 第 1-7 项为 2026-08-19 设计定稿遗留；第 8-11 项为 2026-08-20 章节叙事新增。**滚动叙事四步必须按顺序逐个落地、逐个验收，禁止一次性打包提交**（v0.8.1/v0.11.1 两次整体回滚的教训）。

---

## 参考

- [Getty — Tracing Art](https://www.getty.edu/tracingart/)（Getty Research Institute × Resn）
- [Awwwards — Tracing Art 评审页](https://www.awwwards.com/sites/tracing-art)（调色板与评分数据来源）
- [archival-imagery-mcp on npm](https://www.npmjs.com/package/archival-imagery-mcp) · [GitHub](https://github.com/chandhoke/archival-imagery-mcp)
- [EB Garamond on Google Fonts](https://fonts.google.com/specimen/EB+Garamond)
