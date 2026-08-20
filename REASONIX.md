# Reasonix Project Memory

> 本文件是项目级别的不可变前缀，每个 session 自动加载。保持精简。

---

## 项目定位

**Blog** — 基于 Next.js 16（App Router）的个人博客。全栈单仓库，非 monorepo。

## .claude 文档架构

`.claude/` 是本项目的核心文档体系。所有 agent 开始任务前必须读 `.claude/INDEX.md`。

### 设计原则

1. **面向执行，不面向汇报**。判断标准：一个从没见过本项目的 agent，读完文档能不能直接动手改代码。如果不能，文档不合格。
2. **禁止正确的废话开头**。第一句话就应该是一个具体判断或规则。
3. **因果链，而非 bullet 罗列**。技术决策文档（architecture、conventions、ADR）用"因为 X，所以选 Y，代价是 Z"的散文结构。
4. **每个反直觉的规则必须配反例**。写清楚"如果这么做会导致什么"。

### 文档维度

| 目录 | 回答的问题 |
|------|-----------|
| `architecture/` | 系统长什么样？为什么这样设计？（路由树、渲染策略、Server/Client 边界、数据流、ADR） |
| `conventions/` | 怎么写代码？（组件、路由、数据获取、样式、代码质量、Commit/PR） |
| `data-layer/` | 数据怎么流动？（Server Actions 契约、缓存、客户端状态、Suspense） |
| `loop-engine/` | Agent 怎么工作？（五阶段循环、自动审查、自动清理） |
| `design/` | 长什么样？（视觉 Token、布局模式、Loading/Error 状态、无障碍） |
| `api/` | 对外接口是什么？（Route Handlers、OpenAPI） |
| `testing/` | 怎么测试？（策略、组件测试、E2E、评估） |
| `releases/` | 发布记录在哪？（CHANGELOG、审查报告归档） |
| `future/` | 下一步做什么？（路线图、技术雷达） |
| `task/` | 当前在做什么？（任务卡片、backlog、active） |
| `problem/` | 哪里有问题？（已知问题、技术债务、阻塞项） |
| `onboarding/` | Agent 怎么入門？（阅读顺序指南） |

### 文档分层（圆桌决议 A1，2026-08-20）

为根治"文档与代码脱钩"的结构性成因（历史三次脱钩均因同步依赖自觉、无自动化门禁），文档分两层：

- **契约层**（必须与代码逐字对齐，由 CI 门禁 `pnpm harness:check` 强制校验）：
  - `architecture/app-router-map.md`（路由树）、`architecture/runtime-and-deployment.md`（环境变量表）
  - `data-layer/caching-and-revalidation.md`（缓存 tag）、`data-layer/server-actions-contract.md`（Action 契约）
  - `conventions/code-style/eslint-notes.md`（lint 规则）
  - 契约文档 frontmatter 维护 `last-updated`；修改契约层时同步检查 `scripts/harness-check.mjs` 的检查项是否需扩展
- **叙事层**（记录决策与理由，允许时效性；变更时更新 `last-updated`）：
  - ADR、tech-radar、roadmap、releases 审查报告（review-snapshot 为历史快照不做螺旋更新）
  - design（**设计意图禁改**；其中对代码实际行为的事实陈述受"代码为唯一事实源"管辖，可修正）

### 螺旋增量式更新（核心规则）

**每有代码变动，必须结合上下文进行对应 `.claude/` 文档的更新。更新是融合（fusion），不是追加（append）。**

- ❌ 追加模式：文档顶部是最新内容，往下翻是三个月前的内容，前后矛盾，没人知道哪个是对的。
- ✅ 融合模式：新信息融入文档的对应位置，替换过时内容。文档始终是一个自洽的整体，反映当前代码的真实状态。

**触发条件**：

| 代码变更 | 必须更新的文档 |
|----------|--------------|
| 新增路由 | `architecture/app-router-map.md` + `architecture/rendering-strategy.md`（如渲染模式有变化） |
| 新增/修改 Server Action | `data-layer/server-actions-contract.md`（如契约有变化） |
| 新增依赖 | `future/tech-radar.md`（登记到"当前采用"）+ 判断是否需要 ADR |
| 修改数据库 Schema | `architecture/data-flow.md` + `architecture/system-overview.md` |
| 变更公共 API | `api/route-handlers.md` + `api/openapi.yaml` + `releases/CHANGELOG.md` |
| 新增 Revalidation 逻辑 | `data-layer/caching-and-revalidation.md` |
| 修改组件边界（加/去 `'use client'`） | `architecture/server-client-boundary.md` |
| 引入新的编码约定 | 对应 `conventions/` 文档 |
| Bug 修复（影响用户行为） | `releases/CHANGELOG.md` |
| 完成一个任务 | 对应 task 卡片从 active → done + `releases/CHANGELOG.md` |

**融合更新的格式**：直接在文档对应位置修改内容，更新 `last-updated` 日期。如果文档整体结构需要调整（如新增章节），同时更新。保持文档内部一致性——改动了 A 段，检查 B 段是否也需要同步。

**审查报告登记规则**：每次审查生成的报告（归档物）必须：
1. 归档到 `.claude/releases/`，命名 `NNNN-{type}.md`（序号递增）
2. 在 `.claude/INDEX.md` 中登记，类型标注 `review-snapshot`
3. 在 `.claude/releases/CHANGELOG.md` 中记录
4. 在本文档（REASONIX.md）的变更记录中提及（如涉及架构决策）

未登记索引的审查报告 = 孤儿文档。

### 元信息头规范

每个 `.claude/` 下的 `.md` 文件顶部必须包含：

```yaml
---
status: draft | stable | superseded | review-snapshot
owner: <负责的模块或子系统>
last-updated: YYYY-MM-DD
related-adr: [nnnn, nnnn]  # 如适用
---
```

- `draft` → 占位或编写中，不可作为决策依据
- `stable` → 当前生效的规范或决策
- `superseded` → 已被新文档取代，保留作为历史记录
- `review-snapshot` → 审查报告归档（`releases/NNNN-*.md` 的历史快照，随 INDEX 登记同步标注；此类文档记录发布时点的状态，不做螺旋更新，保留原 `last-updated`）

### ADR 规则

ADR 一旦写入不可修改内容。需要变更决策时：新建 ADR（编号递增），在新 ADR 中显式声明 `supersedes NNNN`。旧 ADR 保留，在顶部加 `> **已被 ADR-NNNN 取代**`。

---

## 技术栈

| 层 | 选型 | 状态 |
|----|------|------|
| 品牌 | ReZenKi（RefrainZen And KiKi）· 黑白简约杂志风 | 已就绪 |
| 框架 | Next.js 16 (App Router) | 已就绪 |
| 语言 | TypeScript 5 (strict) | 已就绪 |
| 样式 | Tailwind CSS 4（黑白灰 oklch token） | 已就绪 |
| 内容 | PostGre 存 Markdown 原文（drizzle 访问） | 已就绪（待迁移） |
| 数据库 | PostgreSQL + Drizzle ORM（`src/lib/schema.ts`） | 已就绪（待迁移） |
| 评论 | 自建，存 PostGre（pending/approved/spam 审核流） | 已就绪（待迁移） |
| 鉴权 | NextAuth v5（仅 Dashboard，C 端无需） | 待实现 |
| 部署 | Vercel（首选）/ Docker（备选） | 待部署 |

## 入口文件分工

| 文件 | 面向 | 职责 |
|------|------|------|
| `REASONIX.md` | Agent（不可变前缀） | 本文件——项目宪法 |
| `AGENTS.md` | Agent（session 首读） | 指向 `.claude/INDEX.md` + 螺旋更新规则 |
| `CLAUDE.md` | Agent（Claude 特化） | → `AGENTS.md` |
| `README.md` | 人类开发者 | 项目介绍 + 快速上手 + 链接到 `.claude/` |
