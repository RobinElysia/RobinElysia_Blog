---
status: stable
owner: testing
last-updated: 2025-07-11
---

# 组件测试约定

## 工具

- **Vitest**：测试运行器（与 Vite 生态一致，速度快）
- **@testing-library/react**：组件渲染和查询
- **@testing-library/user-event**：模拟用户交互
- **@testing-library/jest-dom**：DOM 断言扩展

## Server Component 的测试限制

Server Component **不能**被 @testing-library/react 直接测试——因为它是 async 的且在服务器端渲染，`render()` 是同步的客户端 API。

**应对**：

1. **提取纯逻辑**：如果 Server Component 中有复杂的数据处理逻辑，提取为纯函数，测试纯函数。
   ```ts
   // src/lib/markdown.ts（纯函数，可测试）
   export function extractHeadings(mdx: string): Heading[] { ... }

   // src/lib/markdown.test.ts
   import { extractHeadings } from "./markdown";
   test("extracts h2 headings", () => { ... });
   ```

2. **转为 Client Component 测试交互**：如果组件主要是交互逻辑，它本来就该是 Client Component，正常用 RTL 测试。

3. **E2E 测试覆盖**：Server Component 的渲染结果在 E2E 测试中验证（Playwright 看到的是完整的 HTML）。

## 测试写法规范

### 查询优先级

按 Testing Library 的推荐顺序：

1. `getByRole`（最优先——模拟屏幕阅读器查询）
2. `getByLabelText`（表单字段）
3. `getByText`（可见文字）
4. `getByTestId`（最后手段——当以上三种都不适用时）

```tsx
// ✅ 正确
const button = screen.getByRole("button", { name: "提交评论" });
const input = screen.getByLabelText("评论内容");
const heading = screen.getByText("最新文章");

// ❌ 错误——过度依赖 testId
const button = screen.getByTestId("submit-comment-btn");
```

### 测试结构

```tsx
// 每个测试用例三段式：准备 → 执行 → 断言
test("点击提交按钮后显示成功消息", async () => {
  // ① 准备
  const user = userEvent.setup();
  render(<CommentForm slug="hello-world" />);

  // ② 执行
  await user.type(screen.getByLabelText("评论内容"), "好文章！");
  await user.click(screen.getByRole("button", { name: "提交评论" }));

  // ③ 断言
  expect(await screen.findByText("评论已提交")).toBeInTheDocument();
});
```

### Mock 策略

- **Server Actions**：Mock Server Action 的返回值，不真正连接数据库。
  ```ts
  vi.mock("@/actions/submit-comment", () => ({
    submitComment: vi.fn().mockResolvedValue({ ok: true }),
  }));
  ```

- **next/navigation**：Mock `useRouter`、`useSearchParams` 等。
  ```ts
  vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams("q=test"),
  }));
  ```

- **不 mock 的**：纯 React 行为（useState、useEffect）、Testing Library 的工具函数。
