---
status: stable
owner: architecture
last-updated: 2025-07-11
---

# ADR 0003: 客户端状态管理——不使用全局状态库

## 背景

React 生态有大量状态管理方案（Redux、Zustand、Jotai、Recoil 等）。需要决定本项目是否需要引入全局状态库。

## 决策

**不引入全局状态管理库。** 客户端状态使用 React 内置 API（`useState`、`useReducer`、`useActionState`、`useOptimistic`、URL search params）。

## 理由

1. **RSC 改变了状态管理的前提**。传统 React 应用中，全局状态库的核心价值之一是"跨页面共享服务端数据"——用户在页面 A 获取了数据，切换到页面 B 时不想重新获取。但在 RSC 模型中，每个页面（Server Component）自己获取数据，不需要客户端缓存。Next.js 的自动 fetch 去重 + Data Cache 替代了这个场景。
2. **博客项目的状态复杂度低**。博客没有购物车、多步骤向导、实时协作这类需要全局状态同步的场景。目前识别的客户端状态只有：暗色模式切换、评论表单、搜索输入——全部可以用 `useState` 或 URL params 管理。
3. **减少依赖**。不引入状态库意味着：更小的 bundle、更少的 API 学习成本、升级 Next.js 时少一个兼容性风险。

## 触发重新评估的信号

以下信号出现 **2 个以上** 时，重新评估并选择 Zustand：

1. 多个不相关组件需要响应同一事件（如 WebSocket 推送）
2. 客户端状态需要持久化（localStorage / IndexedDB）
3. 复杂客户端工作流跨 5+ 个组件

## 如果引入 Zustand

- Store 文件放在 `src/stores/`，一个文件一个 store
- Store 不直接调用 Server Actions（由组件调用 action 后更新 store）
- 不在 store 中做数据获取

## 生效日期

2025-07-11
