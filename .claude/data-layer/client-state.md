---
status: stable
owner: data-layer
last-updated: 2025-07-11
related-adr: [0003]
---

# 客户端状态管理

## 选型：无全局状态库

本项目**不使用**全局状态管理库（Redux、Zustand、Jotai）。

**原因**：Next.js App Router 的核心设计目标之一是将状态保留在 Server 端，客户端只负责交互状态。大部分传统全局状态管理解决的问题（"多个页面共享数据"）在 RSC 模型中不存在——Server Component 每次请求都重新获取数据，不需要客户端缓存来跨路由共享。

## 什么算"客户端状态"

| 状态类型 | 例子 | 存放位置 |
|----------|------|----------|
| **URL 状态** | 搜索关键词、分页位置、筛选条件 | `useSearchParams` / `useRouter` |
| **表单状态** | 输入框内容、提交状态 | `useActionState` |
| **UI 状态** | 菜单展开/关闭、模态框显示/隐藏 | `useState`（组件内） |
| **乐观更新** | 点赞后立即显示红心 | `useOptimistic` |
| **服务端数据** | 文章列表、用户信息 | Server Component（不在客户端存） |

## 需要全局状态库的信号

以下信号出现 **2 条以上** 时，才值得引入 Zustand（首选）：

1. 多个不相关组件需要响应同一个事件（如"购物车更新"→ 导航栏 + 侧边栏 + 商品列表同时刷新）
2. WebSocket / SSE 推送的实时数据需要在多个组件消费
3. 复杂的客户端工作流（多步骤向导跨 5+ 个组件）
4. 客户端缓存策略复杂到 `useReducer` 写不下

在此之前，`useState` + `useReducer` + URL search params 足够覆盖所有场景。

## 如果引入 Zustand

```ts
// stores/cart.ts
import { create } from "zustand";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
};

export const useCart = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));
```

约束：
- Store 文件放在 `src/stores/`，一个文件一个 store。
- Store 不直接调用 Server Actions——由组件调用 action，拿到结果后再更新 store。
- 不在 store 中做数据获取（Zustand 不是数据获取工具）。
