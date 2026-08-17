---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# ESLint 配置说明

## 当前规则集

本项目使用 ESLint 9 + `eslint-config-next`（含 `core-web-vitals` + `typescript`）。

详见 `eslint.config.mjs`。

## 强制的额外规则

以下规则在项目中为 **error** 级别，不可降级为 warn：

| 规则 | 原因 |
|------|------|
| `no-console` | 生产代码不允许 `console.log`；`console.warn`/`console.error` 允许 |
| `no-unused-vars` | 未使用的变量可能是未完成的逻辑残片 |
| `@typescript-eslint/no-explicit-any` | 任何 `any` 都需要显式豁免并附注释 |

## 建议规则（warn）

| 规则 | 说明 |
|------|------|
| `@typescript-eslint/explicit-function-return-type` | 提醒补充返回值类型，但不阻止提交 |
| `react/jsx-no-leaked-render` | 防止 `{items.length && <List />}` 渲染 `0` |

## allow 例外场景

以下场景允许 `eslint-disable`，但必须附带原因注释：

```ts
// eslint-disable-next-line no-console -- 错误日志需要输出到服务器 console
console.error("Failed to connect to database:", err);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 第三方库 use-sound 的类型定义不完整
const [play] = useSound(url as any);
```

## 新增/调整规则的流程

1. 在团队讨论中提出（PR 评论或 issue）
2. 在 `.harness/conventions/code-style/eslint-notes.md`（本文件）记录规则及理由
3. 在 `eslint.config.mjs` 中添加
4. 跑 `npm run lint` 确认无意外影响

## Prettier vs ESLint 的边界

| 职责 | 工具 |
|------|------|
| 代码风格（缩进、引号、分号） | **Prettier**（`.prettierrc`） |
| 代码质量（未使用变量、类型安全） | **ESLint**（`eslint.config.mjs`） |

Prettier 不检查代码质量，ESLint 不检查代码风格。两者不重叠。
