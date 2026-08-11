---
status: stable
owner: architecture
last-updated: 2025-07-11
related-adr: []
---

# Server/Client 组件边界

## 判断树

一个组件要不要标记 `'use client'`？按以下流程决策：

```
这个组件用到了以下任一特性？
├── useState / useReducer / useEffect / useRef / useContext
├── 事件处理器（onClick, onChange, onSubmit...）
├── 浏览器 API（localStorage, navigator, window, document...）
├── 第三方库（且该库内部使用了以上任一特性）
│
├── 是 → 必须标记 'use client'
│   └── 这个组件是否可以拆成"交互壳 + 静态芯"？
│       ├── 是 → 交互逻辑抽为 Client Component，静态内容保留为 Server Component
│       └── 否 → 整个组件标注 'use client'
│
└── 否 → 保持在 Server Component（默认）
    └── 这个组件是否作为 children prop 传给 Client Component？
        └── 是 → 仍然保持 Server Component——通过 children slot 注入，
              Server Component 在服务器端渲染后作为静态内容嵌入 Client Component
```

> **⚠️ Server Component 里的表单**：`<form>` 的 `action` 可以是 Server Action（Server Component 合法），但 `onSubmit` 等事件处理器**不能**从 Server Component 传给客户端表单——运行时直接报错 "Event handlers cannot be passed to Client Component props"（v0.6.1 踩坑：Dashboard 删除按钮的 confirm 确认）。任何需要交互的 `<form>`（confirm、受控输入、动态禁用）必须拆 client 组件；Server Action 引用可以跨边界传给 client 组件。

## 反例与代价

### 反例 1：引入图标库导致整棵树变 Client

```tsx
// ❌ 错误：lucide-react 的图标组件内部用了 useState，
// 导致整个 BlogLayout 及其子树全部变成 Client Component
"use client";
import { HomeIcon } from "lucide-react";

export function BlogLayout({ children }) {
  return (
    <div>
      <HomeIcon />
      {children}  {/* children 也被迫水合 */}
    </div>
  );
}
```

```tsx
// ✅ 正确：图标抽成独立的 Client Component，layout 保持 Server
// blog-layout.tsx (Server Component)
import { NavIcon } from "./nav-icon";

export function BlogLayout({ children }) {
  return (
    <div>
      <NavIcon icon="home" />
      {children}  {/* children 保持 Server Component */}
    </div>
  );
}

// nav-icon.tsx (Client Component)
"use client";
import { HomeIcon, SettingsIcon } from "lucide-react";
export function NavIcon({ icon }: { icon: "home" | "settings" }) {
  return icon === "home" ? <HomeIcon /> : <SettingsIcon />;
}
```

**代价**：多一个文件 + 多一层组件嵌套。但换来的是 `children` 不需要水合，省掉了整棵子树的客户端 JS 体积。

### 反例 2：Context 污染

```tsx
// ❌ 错误：为了让深层子组件能读取 theme，
// 把 Provider 放在根 layout 并标注 'use client'
"use client";
export function RootLayout({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

**后果**：整个应用变成 Client Component，失去 RSC 的所有优势。

**正确做法**：ThemeProvider 只包裹需要读 theme 的最小子树，或者通过 cookie + Server Component 传递 theme 初始值。

## 第三方库黑名单

以下库在 `import` 时必须配套 `'use client'`，没有例外：

| 库 | 原因 |
|----|------|
| `lucide-react` | 图标组件内部用了 `useState` |
| `framer-motion` | 动画依赖 `useEffect` + 浏览器 API |
| `zustand` | 基于 `useSyncExternalStore` |
| `@tanstack/react-query` (Provider) | QueryClientProvider 需要 Context |
| 任何基于 `@radix-ui/react-*` 的 UI 库 | 交互组件根节点必然是 Client Component |

> 如果你引入的第三方库不在上表，默认假设它是 Server-compatible，直到编译报错 `useState`/`useEffect` 相关错误时再标注 `'use client'`。
