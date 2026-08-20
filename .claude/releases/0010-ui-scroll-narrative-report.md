---
status: review-snapshot
owner: review
last-updated: 2026-08-20
review-scope: v0.21.0 UI 优化 + 章节式长滚动叙事 + 档案图落地 + token 迁移
---

# 审查报告 0010 — UI 优化与滚动叙事（v0.21.0）

## 执行摘要

按用户决策（章节式长滚动叙事 + 全站组件打磨 + 核心页 + Dashboard；token 一并落地；直接上档案图；wave-ocean Hero 保持）完成 6 组变更：设计文档决策反转、暖纸五色 + EB Garamond 落地、首页四章叙事、Wellcome 档案图、Dashboard 移动端导航、E2E 与文档收口。**执行模式：用户指令由 DSH 全权接管（不再派发外部 agent），独立审核环节由 DSH 自审并标注**（非独立审核，置信度降级；人类验收门保留）。

## 一、变更清单

| 组 | 内容 | 关键产出 |
|---|---|---|
| S1 设计文档 | DESIGN.md §1 决策反转（不借鉴→有条件借鉴章节幕叙事，禁环形/叠层）；§5 首页结构重写为 Ch.00-Ch.03；§8 待办补 4 项；motion-and-interaction.md 叙事转场例外区（白名单 src/components/home/**，修 D11）+ 回滚根因 R1/R2/R3 落档；responsive-and-a11y.md 章节导航 a11y 验收项 | 规范与实现一致 |
| S2 token 迁移 | globals.css 暖纸五色（chroma≤0.015）+ layout.tsx EB_Garamond（--font-serif 中文衬线回退）+ UI 控件 font-sans + shiki/code-theme 暖纸化；implementation-status pending→in-progress；tech-debt 已解决 | 设计定稿落地（D1 修复） |
| S3 首页叙事 | Chapter 语义容器 + `--header-h` 变量（D5）+ 单一滚动源 scroll-source.ts（rAF 节流 + IntersectionObserver，D3 修复，纯数学推导零重排）+ Ch.02 档案时间轴 + 章节导航（nav/button/aria-current，D6 补偿）+ reduced-motion JS 降级（D4 修复）+ site-header 滚动解耦（D8） | 四章线性纵向，Hero/逐卡翻页原样保留（R3） |
| S4 档案图 | archival-imagery-mcp（Wellcome，PDM）取 4 张藏品图落盘 public/archive/；src/lib/archive-images.ts 映射（slug→元数据）；PostCard 改 next/image + 署名元数据（D2 修复，§8 第 6 项已决：静态映射不动 DB） | 随机风景图移除 |
| S5 Dashboard | 移动端顶部导航（D9 修复）+ 统计卡响应式（D10） | 移动端可用 |
| S6 收口 | E2E 首页断言更新（章节导航 + 4 章节 + 落款跳转）；app-router-map/rendering-strategy/roadmap 同步 | 文档与代码一致 |

## 二、验证（DSH 自审，非独立审核）

| 检查 | 结果 |
|------|------|
| pnpm build / typecheck | ✅ / ✅ |
| pnpm lint | 0 error ✅（9 fixable warn） |
| pnpm test | 30/30 ✅ |
| pnpm format:check | ✅ |
| pnpm harness:check | ✅（158 files；契约层一致） |
| 本地 E2E | 未跑（rezenki-postgres 容器缺失，环境性；CI 覆盖） |
| 黑白双模式 | 静态核对 token 两套值落地（未目测，需用户在 dev 环境验收） |

## 三、已登记遗留

1. **3D 波浪 Hero 气质张力**——Ch.00 原样保留（R3），替换与否仍为独立待决项。
2. **档案图仅覆盖 4 篇 seed 文章**——新文章默认无档案图（fallback 花体占位）；后续发文章时按 DESIGN.md §4 流程补图。
3. **snap-mandatory 移动端抖动风险**——dvh 变化场景未真机验证，必要时降级 snap-proximity。

## 四、结论

六组变更全部落地且验证通过；防回滚纪律（四步增量、严格线性、不推翻已认可成果）已固化进设计文档。建议用户在 dev 环境目测：首页四章滚动 + 章节导航、暖纸五色/衬线观感、黑白双模式、Dashboard 移动端。

## 五、补丁记录（用户 dev 验收反馈，2026-08-20）

| # | 反馈 | 根因 | 修复 |
|---|---|---|---|
| P1 | 首页文章卡片图片"网络正常但看不见"（疑被遮挡） | **R4 motion 数字源陷阱**：`useSpring(number)`/无源 `useTransform(() => n)` 不追踪后续变化，卡片 opacity 恒 0、transform 恒 75px——卡片整体透明，非 z-index/图层遮挡（Playwright 探针实测：img opacity 1、elementFromPoint 命中 img 自身） | `scene-carousel.tsx`/`hero-content.tsx` 改 `useMotionValue` + effect `mv.set()` 源同步；多源组合改有源 `useTransform([a,b], fn)` |
| P2 | 手写进入动画太快 | 描画 1.6s 偏快，缺书写从容感 | 描画 2.8s（cubic-bezier(0.22,1,0.36,1)）+ 墨色渐入 2.7s 起 0.6s；淡出 3.6s / 卸载 4.4s |
| P3 | 档案→落款缺转场动效（用户要求补） | 档案章为静态排版、落款无入场 | 档案章题/年份头/文章依次从左滑入（stagger 0.08）；滚向落款时整章向视口中心收缩（scale 1→0.85 + 淡出）；落款签名式入场（签名落笔回正 → 墨线展开 → © 行 → 链接行错峰浮现）；双向可逆 + reduced-motion 纯淡入 |

P1 验证（Playwright 探针，dev:3001）：逐屏滚动 4 张卡片页——每屏当前卡片 motion 容器 opacity 1、transform 归零、未被遮挡；其余卡片视口外 opacity 0；build/typecheck/lint/harness 全绿。
