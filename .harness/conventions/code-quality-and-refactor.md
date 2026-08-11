---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# 代码质量与重构规范

## 烂代码判定标准

以下信号出现任意一条即判定为"需要重构"（不是"建议重构"）：

| 信号 | 检测方式 | 阈值 |
|------|----------|------|
| 函数体超过 50 行 | ESLint `max-lines-per-function` | >50 行 |
| 文件超过 200 行 | 人工 / CI 检查 | >200 行 |
| 圈复杂度 > 10 | ESLint `complexity` | >10 |
| 同一逻辑重复 3 次 | Code Review | 3 次 |
| 函数有 5 个以上参数 | ESLint `max-params` | >4 |
| 注释数量 > 代码行数 30% | 人工检查 | 说明代码难以阅读，需要重写而非注释 |

## 重构流程

重构必须走完整的 Agent Loop（① READ → ② PLAN → ③ ACT → ④ VERIFY → ⑤ ARCHIVE），不能因为是"内部改动不影响功能"就跳过。

**重构 PLAN 阶段额外要求**：
1. 写明重构原因（具体违反了上面哪条标准）
2. 写明"不重构的风险"（如果保持现状，3 个月后会怎样）
3. 如果有测试，在 PLAN 中说明测试是否需要更新

**重构的 ARCHIVE 阶段额外要求**：
- 如果重构改变了任何公共 API（导出函数名、props 类型）→ 必须在 `releases/CHANGELOG.md` 记录为 breaking change
- 如果重构没改公共 API → 在 commit message 中写 `refactor:` 前缀即可，不需 CHANGELOG

## 静态分析参考源

| 工具 | 用途 | 配置文件 |
|------|------|----------|
| ESLint | JavaScript/TypeScript 规范 | `eslint.config.mjs` |
| TypeScript | 类型检查 | `tsconfig.json`（strict: true） |
| Prettier | 格式统一 | `.prettierrc` |
| SonarLint | 代码异味检测 | IDE 插件（可选） |

## 什么时候必须写注释

注释不是"越多越好"。以下场景**必须**写注释：

1. **反直觉的决策**：为什么用 `for` 循环而不用 `.map()`？注释解释原因。
2. **Magic Number**：`const MAX_RETRIES = 3; // CMS API 在高峰期平均失败 2 次后成功`——为什么是 3 不是 5？
3. **Workaround**：绕过了某个框架 bug / 第三方库限制，注释说明 bug issue 链接和预计何时可以移除。

## 什么时候不该写注释

以下场景的注释应当**删除**而非保留：

```ts
// ❌ 废话注释——删掉
// 从数据库获取用户
const user = await db.user.findUnique({ where: { id } });

// ❌ git 记录型注释——git blame 能看到，不需要
// 2023-06-15 修改为使用 Prisma，原来用的是 Sequelize

// ❌ 注释掉的旧代码——Git 历史有，直接删
// const user = await oldDb.findUser(id);
```

## 与 Auto Review 的关系

本文件定义"什么是烂代码"和"什么时候该重构"。`loop-engine/auto-review.md` 定义审查清单（类型安全、边界条件等），`loop-engine/auto-cleanup.md` 定义清理死代码和格式。三者互补：

```
code-quality-and-refactor.md  →  定义标准和重构流程
auto-review.md                →  定义每次提交前的检查项
auto-cleanup.md               →  定义定期清理动作
```
