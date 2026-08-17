---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# TypeScript 配置说明

## Strict 模式

`tsconfig.json` 中 `"strict": true` 启用了以下全部子选项：

| 选项 | 效果 | 不可退出的理由 |
|------|------|---------------|
| `strictNullChecks` | `null` 和 `undefined` 不能赋值给非空类型 | 80% 的运行时 bug 来自 null/undefined |
| `noImplicitAny` | 禁止隐式 `any` | 等于没有类型检查 |
| `strictFunctionTypes` | 函数参数逆变检查 | 防止回调参数类型错误 |
| `strictBindCallApply` | `bind/call/apply` 参数检查 | 少用但开了没坏处 |
| `strictPropertyInitialization` | 类属性必须初始化 | 本项目以函数组件为主，影响不大 |
| `noImplicitThis` | 禁止隐式 `any` 的 `this` | 同上 |
| `alwaysStrict` | 输出 `"use strict"` | 默认行为 |

## 类型收窄约定

优先使用以下方式收窄类型，而非 `as` 断言：

```ts
// ✅ 最佳：类型守卫
function isPost(obj: unknown): obj is Post {
  return typeof obj === "object" && obj !== null && "slug" in obj;
}

// ✅ 可接受：early return
if (!post) return <NotFound />;

// ⚠️ 谨慎使用：as（仅在类型守卫不可行时）
const el = document.getElementById("root") as HTMLDivElement;

// ❌ 禁止：双重断言
const x = value as unknown as SomeType;
```

## any 的例外情形

以下场景允许 `any`，但必须附 `eslint-disable-next-line` + 注释：

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fetch 响应体的 JSON 类型由调用方校验
const data: any = await res.json();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- catch 子句中的 error 类型就是 unknown | any
} catch (err: any) {
```

**任何其他使用 `any` 的情形都应在 Code Review 中被拒绝。**

## 泛型优先级

当需要用泛型时，优先用 `extends` 约束而非自由泛型：

```ts
// ✅ 被约束的泛型——知道 T 至少有什么属性
function getSlug<T extends { slug: string }>(item: T): string {
  return item.slug;
}

// ❌ 无约束泛型——T 可以是任何东西，函数体内只能当 unknown 用
function getSlug<T>(item: T): string {
  return (item as any).slug; // forced to use any
}
```
