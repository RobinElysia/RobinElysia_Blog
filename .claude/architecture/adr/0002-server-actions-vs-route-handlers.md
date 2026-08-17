---
status: stable
owner: architecture
last-updated: 2025-07-11
---

# ADR 0002: Server Actions 为主、Route Handlers 为辅

## 背景

Next.js 16 提供两种服务端逻辑承载方式：Server Actions（表单 action、按钮事件）和 Route Handlers（`app/api/*/route.ts`）。需要决定各自的适用场景。

## 决策

**默认使用 Server Actions。Route Handlers 仅在以下场景使用：**

1. 外部系统回调（Webhook、OAuth callback）
2. 需要暴露给移动端 App 的 API
3. RSS Feed / Sitemap 等机器可读端点
4. 需要自定义 HTTP 响应头 / 状态码 / 流式响应的场景

## 理由

1. **渐进增强**：Server Actions 在浏览器禁用 JS 时仍然工作（走原生 `<form>` 提交），而 Route Handler 的客户端 fetch 调用没有 JS 就废了。
2. **类型安全**：Server Action 的返回值可以在 Server 和 Client 之间共享类型（`ActionResult<T>`），Route Handler 的 `Response.json()` 类型需要手动维护。
3. **revalidation 集成**：Server Action 中直接调用 `revalidateTag()` / `revalidatePath()` 自然且可追踪。Route Handler 中做 revalidation 需要额外的错误处理层。
4. **代码组织**：Server Action 可以和页面组件放在同一文件（`"use server"` 指令在文件顶部），或放在 `src/actions/` 目录。Route Handler 必须放在 `app/api/` 的特殊路径下，远离使用方。

## 代价

1. **移动端 App 需要单独的 API 层**：Server Actions 的设计目标不是 RESTful API —— 它们依赖 Next.js 的 RSC 协议，不适合移动端直接调用。移动端需要的接口必须额外写 Route Handler。这导致了"两个后端"的维护成本。
2. **调试困难**：Server Action 的调用是 Next.js 内部的 POST，不直观可见于 Network 面板。调试时需要在终端看 Server Action 日志或在代码中打 `console.log`。
3. **测试不便**：Server Action 不容易像 Route Handler 那样用 `curl` 或 Postman 独立测试。

## 替代方案

| 方案 | 为什么不选 |
|------|-----------|
| 只用 Route Handlers | 失去类型安全、revalidation 便利、渐进增强 |
| 只用 Server Actions | 无法服务外部消费者（移动端、webhook） |

## 生效日期

2025-07-11
