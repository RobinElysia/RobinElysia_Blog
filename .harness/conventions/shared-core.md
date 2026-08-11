---
status: not-applicable
owner: conventions
last-updated: 2025-07-11
---

# 共享核心逻辑约定

**本项目不是 monorepo。** 无 `packages/core` 目录。

如果未来拆分为 monorepo（例如新增 React Native 移动端），届时再激活本文档。需要迁移到 `packages/core` 的逻辑包括：

- 共享的 TypeScript 类型定义
- 共享的工具函数（如日期格式化、Markdown 解析）
- 共享的常量（如站点名称、社交链接）

在此之前，所有共享逻辑放在 `src/lib/` 或 `src/_lib/` 中。
