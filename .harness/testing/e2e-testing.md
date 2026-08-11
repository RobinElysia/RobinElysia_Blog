---
status: stable
owner: testing
last-updated: 2025-07-11
---

# E2E 测试约定

## 工具

- **Playwright**：浏览器自动化

## 核心流程清单

以下 5 条流程必须覆盖（按优先级）：

| # | 流程 | 覆盖的价值 |
|---|------|-----------|
| 1 | 访问首页 → 看到文章列表 | 首页渲染不崩溃 |
| 2 | 点击文章 → 看到文章正文 | 文章详情页 SSR 正常 |
| 3 | 访问不存在的文章 → 看到 404 | not-found.tsx 正常工作 |
| 4 | 提交评论 → 看到成功提示 | Server Action 端到端通畅 |
| 5 | 访问 Dashboard（未登录）→ 重定向到登录页 | 鉴权中间件正常工作 |

## 测试数据管理

- E2E 测试使用**独立的测试数据**（seed 脚本在 `e2e/seed.ts`），不与开发/生产数据混合。
- 每次 E2E 运行前重置数据（`beforeAll` 中调用 seed 脚本）。
- 不在 E2E 测试中硬编码真实文章 slug（如 `hello-world`），使用 `.env.test` 中的环境变量。

## 选择器策略

同上——优先 `getByRole`、`getByLabelText`、`getByText`，最后 `data-testid`。

```ts
// ✅ 正确
await page.getByRole("heading", { name: "最新文章" }).isVisible();
await page.getByRole("link", { name: /阅读更多/ }).first().click();

// ❌ 错误
await page.locator('[data-testid="post-card-0"]').click();
```

## CI 执行

- PR 到 `main` 分支时自动运行全部 E2E 流程
- 使用 Playwright 的 GitHub Actions 集成
- 测试结果截图保存在 CI artifacts 中（用于失败排查）
- 超时阈值：单个测试 30s，全量 5min
