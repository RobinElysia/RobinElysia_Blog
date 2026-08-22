---
status: stable
owner: testing
last-updated: 2026-08-22
---

# 测试策略

## 现有测试清单（2026-08-22）

| 文件 | 覆盖 |
|------|------|
| `src/lib/auth-allowlist.test.ts` | GitHub 登录白名单（空=拒绝、大小写、逗号、空格） |
| `src/lib/feed.test.ts` | RSS 生成 |
| `src/lib/format.test.ts` | 日期/slug 格式化 |
| `src/lib/toc.test.ts` | 目录提取 |
| `src/lib/archive-source.test.ts` | 档案图候选：IIIF URL 构造、license 白名单、主题池抽取、命中过滤（14 个） |

共计 44 单测；6 条 E2E 核心流程（清单见 e2e-testing.md）。

> 注：`archive-source.test.ts` 只测纯函数不触网；管线整体（Wellcome 检索→下载→入库→孤儿清扫）依赖外部服务，通过编辑器人工冒烟验证（见 0012 报告），不做 CI 自动化——上游不可用会让测试抖动。

## 分层策略

| 层级 | 工具 | 覆盖目标 | 速度 | 文件位置 |
|------|------|----------|------|----------|
| **单元测试** | Vitest | 工具函数、类型守卫、数据转换逻辑 | < 5s | 与被测文件同目录 `*.test.ts` |
| **组件测试** | Vitest + @testing-library/react | 交互逻辑、状态变化、可访问性 | < 30s | 与组件同目录 `*.test.tsx` |
| **E2E 测试** | Playwright | 关键用户流程（访问首页 → 查看文章 → 提交评论） | < 5min | `e2e/` 目录 |
| **类型测试** | `pnpm typecheck`（`tsc --noEmit`）+ `expect-type` | 类型推断正确性 | < 10s | CI 中运行 |

## 覆盖率目标

| 层级 | 目标 | 说明 |
|------|------|------|
| 单元测试 | ≥ 80% 行覆盖 | 工具函数和业务逻辑 |
| 组件测试 | 关键交互全覆盖 | 不追求覆盖率，追求关键路径 |
| E2E | 6 条核心流程 | 不贪多，每条覆盖一个业务价值（清单见 e2e-testing.md） |

**不追求 100% 覆盖率**。"覆盖率 100% 但都是表面测试"比"覆盖率 50% 但只测关键路径"更差。

## 什么必须测

1. 用户可见的行为改变（点击按钮 → 出现模态框）
2. 数据转换逻辑（日期格式化、Markdown 转 HTML、slug 生成）
3. 边界条件（空数组、null、undefined、超长文本）
4. 错误路径（API 返回 500、网络断开）
5. Server Action 的校验逻辑（输入为空、超长、非法字符）

## 什么可以不测

1. 纯渲染的 Server Components（没有交互、没有条件分支）—— 类型检查已覆盖
2. Tailwind class 的视觉效果 —— 视觉回归测试成本太高，给设计文档 + Code Review 人工检查
3. 第三方库的内部实现 —— 库作者负责
4. 数据库查询本身 —— 用 mock，不测 ORM 的正确性

## CI 集成

```yaml
# 伪代码 —— 实际在 .github/workflows/ 中配置
test:
  - pnpm lint
  - pnpm typecheck
  - pnpm test
  - pnpm test:e2e  # 仅 main 分支 PR 时运行（耗时）
```

**约束**：lint 和 typecheck 失败时，测试不运行（快速失败）。
