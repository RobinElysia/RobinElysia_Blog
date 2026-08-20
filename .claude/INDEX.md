---
status: stable
owner: architecture
last-updated: 2026-08-20
---

# .claude 文档总索引

> **规则：本索引随文档增减必须同步更新。任何 `.claude/` 下新增的 `.md` / `.yaml` 文件必须在此登记，否则视为孤儿文档。**
>
> **审查报告登记规则：每次审查产生的报告归档到 `.claude/releases/`（命名 `NNNN-{type}.md`）后，必须在本索引的 releases 节登记，类型标注 `review-snapshot`。未登记的审查报告 = 孤儿文档。**

---

## 必读顺序

一个新 agent 进入本项目时，按以下顺序阅读：

1. **onboarding/** → 了解仓库全貌和文档导航
2. **architecture/** → 理解系统设计和技术决策
3. **conventions/** → 掌握编码规范和约束
4. **data-layer/** → 理解数据如何流动
5. **loop-engine/** → 理解 agent 工作流（循环、审查、清理）
6. **其余（design / api / testing / releases / future / task / problem）** → 按需查阅

---

## 文件清单

### onboarding/ — 入门指南

| 文件 | 用途 | 状态 |
|------|------|------|
| `onboarding/how-agents-should-read-this-repo.md` | Agent 首次接触项目时的阅读指南（含必读顺序、常见任务文档映射） | stable |

### architecture/ — 架构说明

| 文件 | 用途 | 状态 |
|------|------|------|
| `architecture/system-overview.md` | 全局架构图：谁调用谁，部署形态，模块职责 | stable |
| `architecture/app-router-map.md` | 路由树、layout 嵌套、route groups | stable |
| `architecture/rendering-strategy.md` | 每类页面用 SSR/SSG/ISR/PPR 的选型依据 + 决策矩阵 | stable |
| `architecture/server-client-boundary.md` | `'use client'` 判断树、黑名单、反例 | stable |
| `architecture/data-flow.md` | 一次请求的完整链路（读 + 写），每一步的机制标注 | stable |
| `architecture/runtime-and-deployment.md` | Edge vs Node runtime、部署目标（Vercel/Docker）、环境变量 | stable |

#### architecture/adr/ — 架构决策记录

| 文件 | 用途 | 状态 |
|------|------|------|
| `architecture/adr/0001-app-router-vs-pages-router.md` | 为什么选 App Router 而非 Pages Router | stable |
| `architecture/adr/0002-server-actions-vs-route-handlers.md` | Server Actions 与 Route Handlers 的选用边界 | stable |
| `architecture/adr/0003-state-management-choice.md` | 不使用全局状态库的决策及触发重新评估的信号 | stable |
| `architecture/adr/0004-supersedes-0003-xxx.md` | 预留：推翻 0003 时在此声明 supersedes | draft |
| `architecture/adr/0005-database-and-orm.md` | PostGre + Drizzle 选型、评论自建（存 Markdown 原文） | stable |

### conventions/ — 代码规范与编写约定

| 文件 | 用途 | 状态 |
|------|------|------|
| `conventions/code-quality-and-refactor.md` | 烂代码判定标准、重构流程、三文档互补关系 | stable |
| `conventions/component-conventions.md` | 组件命名、目录内聚、导出约定、拆分粒度 | stable |
| `conventions/routing-conventions.md` | 动态路由命名、私有文件夹 vs Route Group、layout 嵌套 | stable |
| `conventions/data-fetching-conventions.md` | fetch 参数约定、错误处理、超时策略、loading 模式 | stable |
| `conventions/styling-conventions.md` | Tailwind CSS 4 使用边界、Design Token 引用、暗色模式 | stable |
| `conventions/shared-core.md` | **not-applicable**（非 monorepo） | not-applicable |
| `conventions/commit-and-pr.md` | Conventional Commits、PR 模板、ADR/CHANGELOG 联动 | stable |
| `conventions/code-style/eslint-notes.md` | ESLint 规则集、allow 例外、新增规则流程 | stable |
| `conventions/code-style/typescript-notes.md` | strict 模式、类型收窄、any 例外、泛型约束 | stable |

### data-layer/ — 数据与状态管理

| 文件 | 用途 | 状态 |
|------|------|------|
| `data-layer/server-actions-contract.md` | ActionResult 类型、useActionState 消费、鉴权约定 | stable |
| `data-layer/caching-and-revalidation.md` | cache tag 命名规范、revalidatePath vs revalidateTag、开发环境警告 | stable |
| `data-layer/client-state.md` | 无全局状态库的选型理由、触发引入的信号、Zustand 约束 | stable |
| `data-layer/streaming-and-suspense.md` | Suspense 边界粒度、Skeleton 规范、不 stream 的场景 | stable |

### loop-engine/ — Agent 工作流

| 文件 | 用途 | 状态 |
|------|------|------|
| `loop-engine/loop-protocol.md` | 五阶段循环（READ → PLAN → ACT → VERIFY → ARCHIVE）、快捷模式、回退机制 | stable |
| `loop-engine/auto-review.md` | 六类自动审查清单（类型/边界/性能/安全/一致性/孤儿引用）、禁手规则 | stable |
| `loop-engine/auto-cleanup.md` | 死代码移除、未使用依赖清理、import 整理、清理后二次验证 | stable |

### design/ — 设计风格说明

> **上位文件：根目录 `DESIGN.md`** — 简约复古艺术风视觉总纲（风格定位、色彩/字体决策理由、档案图取用流程、动效与无障碍的上位约束）。本目录承载落地细则，不重复其论证；两者冲突时以 `DESIGN.md` 为准。

| 文件 | 用途 | 状态 |
|------|------|------|
| `design/visual-style-guide.md` | Design Token（暖纸五色、Italianno 花体 + EB Garamond 衬线 + 系统栈）、图像规范 | **stable**（品牌 RobinElysia 已定稿） |
| `design/layout-patterns.md` | 全局布局、页面布局模式（首页/详情/Dashboard）、约束 | stable |
| `design/motion-and-interaction.md` | 动效总则、动画分类落地表、禁用清单（含做旧特效）、Server/Client 边界约束 | stable |
| `design/loading-and-error-states.md` | Loading/Error 策略矩阵、Skeleton 设计原则、error.tsx 规范 | stable |
| `design/responsive-and-a11y.md` | 断点、WCAG 2.1 AA、复古风额外风险点、键盘导航、语义化 HTML、Reduced Motion | stable |

### api/ — 对外接口文档

| 文件 | 用途 | 状态 |
|------|------|------|
| `api/route-handlers.md` | Route Handler 清单（RSS/Sitemap/Webhook）、编写规范、鉴权方式 | stable |
| `api/openapi.yaml` | 当前生效的 OpenAPI 契约（待 API 确定后填充） | draft |
| `api/versions/v1/openapi.yaml` | v1 冻结版本契约 | draft |
| `api/versions/CHANGELOG.md` | API 版本变更日志 | draft |

### testing/ — 测试说明

| 文件 | 用途 | 状态 |
|------|------|------|
| `testing/test-strategy.md` | 四层测试策略（单元/组件/E2E/类型）、覆盖目标、必须测/可不测 | stable |
| `testing/component-testing.md` | RTL 约定、查询优先级、Server Component 测试限制、Mock 策略 | stable |
| `testing/e2e-testing.md` | Playwright 核心流程 6 条、测试数据管理、选择器策略 | stable |
| `testing/eval-scenarios.md` | 当前无自动 eval、未来引入场景 | stable |

### releases/ — 发布管理

| 文件 | 用途 | 状态 |
|------|------|------|
| `releases/CHANGELOG.md` | 版本发布变更日志（遵循 Keep a Changelog） | stable |
| `releases/0001-initial-review-report.md` | 首轮审查报告（骨架阶段） | review-snapshot |
| `releases/0002-final-review-report.md` | 文档体系完整化审查报告 | review-snapshot |
| `releases/0003-architecture-decisions-report.md` | 架构决策落地审查报告（PostGre/品牌/依赖） | review-snapshot |
| `releases/0004-motion-and-distribution-report.md` | 动效与分发功能批次审查报告（v0.3.0） | review-snapshot |
| `releases/0005-dual-mode-and-layout-report.md` | 黑白双模式与布局加宽报告（v0.4.0） | review-snapshot |
| `releases/0006-full-blog-features-report.md` | 完整博客功能批次报告（v0.5.0） | review-snapshot |
| `releases/0007-creation-and-quality-report.md` | 创作端与质量基建报告（v0.6.0） | review-snapshot |
| `releases/0008-editor-and-rendering-report.md` | 编辑器与渲染增强报告（v0.7.0） | review-snapshot |
| `releases/0009-harness-sync-report.md` | Harness 文档-代码同步报告（v0.20.0，五阶段 S1-S5） | review-snapshot |
| `releases/0010-ui-scroll-narrative-report.md` | UI 优化与滚动叙事报告（v0.21.0：章节叙事/档案图/token 迁移） | review-snapshot |
| `releases/migrations/` | 数据库 / 数据迁移脚本 | 暂无 |

### future/ — 未来规划

| 文件 | 用途 | 状态 |
|------|------|------|
| `future/roadmap.md` | 短/中/长期路线图，含优先级排序依据 | stable |
| `future/tech-radar.md` | 当前采用 / 试验中 / 观望中 / 已放弃评估的技术 | stable |

### task/ — 任务管理

| 文件 | 用途 | 状态 |
|------|------|------|
| `task/README.md` | 任务卡片模板 + 3 个完整示例 + 验收标准写法 + 状态流转 | stable |
| `task/backlog/` | 待排期任务卡片 | 暂无 |
| `task/active/` | 当前迭代进行中的任务卡片 | 暂无 |

### problem/ — 问题追踪

| 文件 | 用途 | 状态 |
|------|------|------|
| `problem/known-issues.md` | 已知但暂不修复的问题（含格式约定） | stable |
| `problem/tech-debt.md` | 已识别的技术债务（含格式约定） | stable |
| `problem/blockers/` | 当前阻塞项 | 暂无 |

---

## 文档统计

| 分类 | 总数 | stable | draft | not-applicable | review-snapshot |
|------|------|--------|-------|----------------|-----------------|
| onboarding | 1 | 1 | 0 | 0 | 0 |
| architecture | 11 | 10 | 1 | 0 | 0 |
| conventions | 9 | 8 | 0 | 1 | 0 |
| data-layer | 4 | 4 | 0 | 0 | 0 |
| loop-engine | 3 | 3 | 0 | 0 | 0 |
| design | 5 | 5 | 0 | 0 | 0 |
| api | 4 | 1 | 3 | 0 | 0 |
| testing | 4 | 4 | 0 | 0 | 0 |
| releases | 11 | 1 | 0 | 0 | 10 |
| future | 2 | 2 | 0 | 0 | 0 |
| task | 1 | 1 | 0 | 0 | 0 |
| problem | 2 | 2 | 0 | 0 | 0 |
| **合计** | **57** | **42** | **4** | **1** | **10** |

---

## 孤儿文档

当前无孤儿文档。如发现 `.claude/` 下有文件未在上表登记，请补充或标记为孤儿。
