---
status: stable
owner: onboarding
last-updated: 2026-08-20
---

# Agent 阅读指南

## 仓库结构

```
blog/
├── .claude/              # ★ 项目文档与规范（Agent 的核心参考源）
│   ├── INDEX.md           # 文档总索引——从这里开始
│   ├── onboarding/        # 本文件所在目录
│   ├── architecture/      # 系统设计和技术决策（含 adr/）
│   ├── conventions/       # 编码规范和约束（含 code-style/）
│   ├── data-layer/        # 数据流动机制（缓存/契约/状态）
│   ├── loop-engine/       # Agent 工作流（循环、审查、清理）
│   ├── design/            # 视觉风格与布局规范（上位约束：根 DESIGN.md）
│   ├── api/               # 对外接口
│   ├── testing/           # 测试策略
│   ├── releases/          # 版本日志 + 审查报告归档
│   ├── future/            # 路线图和技术雷达
│   ├── task/              # 任务卡片
│   └── problem/           # 已知问题和技术债务
├── src/
│   ├── app/               # App Router（路由、页面、布局）
│   ├── components/        # 共享组件（admin/、home/、motion/ 等）
│   ├── lib/               # 数据访问层与工具（schema/db/posts/comments/mdx 管线）
│   └── actions/           # Server Actions（comment/admin）
├── e2e/                   # Playwright E2E（blog.spec.ts）
├── drizzle/               # 数据库迁移
├── scripts/               # migrate.mjs（容器启动迁移）
├── .github/workflows/     # CI
├── AGENTS.md              # Agent 入口（必读三步 + 螺旋更新规则）
├── CLAUDE.md              # → AGENTS.md
├── REASONIX.md            # 项目宪法（文档架构的设计依据，本指南的来源）
├── DESIGN.md              # 设计总纲（设计相关禁改区）
├── README.md              # 人类开发者快速上手
└── DEPLOY.md              # Docker 生产部署指南
```

> **内容存储说明**：文章正文存 PostgreSQL `posts` 表（Markdown 原文），**没有 `src/content/` MDX 文件目录**。渲染由 `src/lib/mdx-options.ts` 统一管线完成。

## 必读顺序

一个新 agent 进入本项目时，按以下顺序阅读文档。每一步标注了"读完后你应该能回答什么问题"。

### 第一步：入门（2 分钟）

1. **本文件**（`onboarding/how-agents-should-read-this-repo.md`）
   → 读完后：你知道文档在哪、按什么顺序读

2. **`.claude/INDEX.md`**
   → 读完后：你知道每篇文档的用途和位置

### 第二步：架构（10 分钟）

3. **`architecture/system-overview.md`**
   → 读完后：你能画出项目的全局架构图

4. **`architecture/app-router-map.md`**
   → 读完后：你知道路由在哪、layout 怎么嵌套、route group 的意图

5. **`architecture/rendering-strategy.md`**
   → 读完后：你知道每个页面用什么渲染模式、为什么

6. **`architecture/server-client-boundary.md`**
   → 读完后：你能判断一个组件要不要标 `'use client'`

7. **`architecture/data-flow.md`**
   → 读完后：你能追踪一次请求的完整链路

### 第三步：规范（10 分钟）

8. **`conventions/component-conventions.md`**
   → 读完后：你知道组件怎么命名、怎么组织、什么时候拆分

9. **`conventions/data-fetching-conventions.md`**
   → 读完后：你知道 fetch 的参数约定、错误处理模式

10. **`conventions/routing-conventions.md`**
    → 读完后：你知道路由命名、私有文件夹、动态路由的规则

11. **`conventions/styling-conventions.md`**
    → 读完后：你知道 Tailwind 和 CSS Modules 的使用边界

### 第四步：数据层（5 分钟）

12. **`data-layer/server-actions-contract.md`**
    → 读完后：你知道 Server Action 怎么定义返回值、客户端怎么消费

13. **`data-layer/caching-and-revalidation.md`**
    → 读完后：你知道什么时候用 cache、什么时候 revalidate

### 第五步：工作流（5 分钟）

14. **`loop-engine/loop-protocol.md`**
    → 读完后：你知道修改代码必须走哪五个阶段

15. **`loop-engine/auto-review.md`**
    → 读完后：你知道提交前必须检查哪六类问题

16. **`loop-engine/auto-cleanup.md`**
    → 读完后：你知道功能完成后如何清理代码

### 第六步：按需（视任务而定）

- 写测试 → `testing/test-strategy.md`、`testing/component-testing.md`
- 加 API → `api/route-handlers.md`
- 做设计 → `design/visual-style-guide.md`、`design/layout-patterns.md`
- 发布上线 → `releases/CHANGELOG.md`
- 做技术选型 → `architecture/adr/`（先看现有 ADR 有没有覆盖）
- 规划功能 → `future/roadmap.md`

## 修改代码前必须查阅的文档

| 你准备做什么 | 必须读的文档 |
|-------------|-------------|
| 新增页面 | `app-router-map.md` + `rendering-strategy.md` |
| 加 `'use client'` 标记 | `server-client-boundary.md` |
| 写 Server Action | `server-actions-contract.md` + `caching-and-revalidation.md` |
| 写 fetch | `data-fetching-conventions.md` |
| 写组件 | `component-conventions.md` + `styling-conventions.md` |
| 修改路由 | `routing-conventions.md` |
| 改数据库/API 契约 | `data-flow.md` + 相关 ADR |
| 引入新依赖 | `tech-radar.md`（看是否已有评估）+ 判断是否需要 ADR |

## 当你不知道做某事该读什么文档时

回到 `.claude/INDEX.md`，按"必读顺序"逐级查找。如果找不到，说明文档体系有缺口——在 `.claude/problem/known-issues.md` 记录。不要自己编规则。
