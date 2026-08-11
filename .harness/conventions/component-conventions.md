---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# 组件编写约定

## 组件目录内聚规则

**规则**：组件的类型定义、样式、测试文件与组件本体同目录。

```
✅ 正确
src/components/button/
├── button.tsx
├── button.test.tsx
├── button.types.ts
└── button.module.css

❌ 错误
src/components/button.tsx
src/types/button.types.ts       ← 如果删除 Button 组件，这个文件会变成孤儿代码
src/styles/button.module.css    ← 同上
src/__tests__/button.test.tsx   ← 同上
```

**反例**：把 Button 的 props 类型放进全局 `types/index.ts`，会导致组件删除时类型定义变成孤儿代码，且难以追踪谁在用。六个月后，`types/index.ts` 里会堆满已删除组件的类型定义，没人敢删。

## Server/Client Component 命名

- **Server Components**：不加后缀，默认即 Server Component。
- **Client Components**：如果文件较多，可以在同目录下用 `client.tsx` 后缀区分，但不强制。`'use client'` 指令本身已足够明确。

## 组件文件结构

每个组件文件按以下顺序：

```tsx
// 1. 外部依赖 import
import { cn } from "@/lib/utils";
import Image from "next/image";

// 2. 内部模块 import
import { Button } from "@/components/button";

// 3. 类型定义（如未抽到 .types.ts）
type CardProps = { ... };

// 4. 组件本体
export function Card({ title, children }: CardProps) {
  return <div>{...}</div>;
}

// 5. 如有子组件，放在同一文件末尾
function CardFooter({ ... }) { ... }
```

## 导出约定

- **普通组件**一律用 **named export**，不用 default export。原因：default export 允许 import 时任意命名，导致代码审查和重构时难以追踪组件引用。
- **路由文件**（`page.tsx`、`layout.tsx`、`route.ts`、`loading.tsx`、`error.tsx`、`not-found.tsx`）**必须用 default export**——这是 Next.js 的硬性要求，官方文档明确"add a page file and default export a React component"。路由文件不适用 named export 规则。

```tsx
// ✅ 正确：普通组件用 named export
export function PostCard({ title }: { title: string }) { ... }

// ✅ 正确：路由文件必须 default export
export default function Page() { ... }

// ❌ 错误：路由文件用 named export 会导致 build 失败
export function Page() { ... }
```

**反例**：曾有一版规范要求路由文件也用 named export，导致 `next build` 报"Missing default export in page"。任何"统一用 named export"的规则都必须排除路由文件。

## 组件拆分粒度

拆分组件的触发条件（满足任一条即拆）：

1. 单个文件超过 **200 行**（不含测试）。
2. 一个组件内有 **3 个以上** 独立的 UI 区块（如 header、sidebar、content），且各自有自己的状态或样式。
3. 一个逻辑被 **2 个以上** 路由复用。
4. 一个 JSX 子树需要独立的 Suspense 边界。

**反例**：把"3 行 JSX 的按钮"拆成独立组件，"为了组件化而组件化"——增加文件跳转成本，不带来任何复用收益。
