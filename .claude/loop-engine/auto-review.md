---
status: stable
owner: loop-engine
last-updated: 2026-08-20
---

# 自动代码审查规则

Agent 在完成代码修改后，除 VERIFY 阶段的自动化检查外，必须执行以下审查步骤。每一条都是可检查的、可验证的，不是"保持代码整洁"这种空话。

## 审查清单（逐条执行，不得跳过）

### A. 类型安全

```
□ 没有 `any` 类型（除非在 reviewed-any.md 中登记的例外场景）
□ 没有 `as` 类型断言（除非是 DOM ref、第三方库类型缺陷）
□ 所有函数返回值有显式类型标注（不依赖类型推断）
□ API 返回值和 Server Action 返回值有统一类型（ActionResult<T>）
```

**反例**：
```ts
// ❌ 两个问题：1. any 吞掉了类型  2. as 强制断言掩盖了不一致
const data = await fetch("/api/posts").then(r => r.json()) as any;
return <PostList posts={data.items} />; // items 可能不存在，运行时炸
```

**正确**：
```ts
// ✅ 明确的类型 + 运行时校验
type Post = { id: string; title: string; slug: string };
type ApiResponse = { items: Post[] };
const data: ApiResponse = await fetch("/api/posts").then(r => r.json());
return <PostList posts={data.items} />;
```

### B. 边界条件

```
□ 空数组 / null / undefined 有处理（EmptyState 或 fallback）
□ 错误状态有处理（error.tsx 或 error boundary）
□ 加载状态有处理（loading.tsx 或 Suspense fallback）
□ 长文本有截断（>100 字符的文章标题 → line-clamp）
□ 图片有 alt 文本（无 alt 的图片在 lint 中报 error）
```

### C. 性能

```
□ 没有在 Server Component 中 import 客户端专用模块
□ 没有在 layout.tsx 中做数据获取（除非该数据是所有子路由的公共依赖）
□ Suspense 边界粒度合理（不包裹整个页面，而是包裹独立数据区块）
□ 图片使用了 next/image（非静态 import 的远程图片有 width/height）
□ 没有在渲染路径中使用 `useEffect` 做数据获取（React 19 用 use() 或 fetch）
```

### D. 安全

```
□ Server Action 内部有鉴权检查（不依赖 Middleware 的鉴权）
□ 用户输入有校验（Server Action 中用 Zod 或手动校验）
□ 没有在 Client Component 中暴露数据库凭证或 API key
□ 敏感操作（删除、权限变更）有二次确认（CSR 中的 confirm 对话框）
□ SQL 查询使用了参数化查询（如果直接写 SQL），没有拼接用户输入
```

### E. 一致性

```
□ 新代码遵循项目已有的命名规范（文件名、函数名、变量名）
□ 新组件使用 named export（不用 default export）
□ fetch 的 tag 命名遵循 `{entity}:{identifier}` 规范
□ 错误处理模式与 `data-fetching-conventions.md` 一致
□ 返回值形状与 `server-actions-contract.md` 一致
```

### F. 孤儿引用

```
□ 删除组件时，检查是否有其他文件仍在 import 该组件
□ 删除类型定义时，检查是否有其他文件引用该类型
□ 删除工具函数时，全局搜索调用点
□ 新增依赖时，确认该依赖在 package.json 中（不是隐式依赖）
```

---

## 审查执行方式

Agent 必须在提交前逐条检查并输出审查报告到终端，格式：

```
## Auto Review Report

### A. 类型安全
[✅] 无 any 类型
[✅] 无 as 断言
[⚠️] getPost() 返回值缺少显式类型标注 → 已在后续 commit 中修复
[✅] Server Action 使用 ActionResult<T>

### B. 边界条件
[✅] 空数组返回 <EmptyState />
[✅] 错误状态有 error.tsx 兜底
[❌] PostCard 的标题未做 line-clamp → 须修复后再提交
...

### 结论：3/4 项通过，1 项待修复（B. 边界条件）
```

❌ 项必须修复后才能进入 VERIFY 阶段。⚠️ 项可选修复，但必须在 ARCHIVE 阶段记录为 tech-debt。

---

## 禁手规则（Zero-Tolerance）

以下行为无论出于什么理由，一旦发现即为审查不通过：

| 规则 | 说明 |
|------|------|
| `// eslint-disable` 无注释 | 必须附 `// reason: {为什么需要禁用这条规则}` |
| `// @ts-ignore` 或 `// @ts-expect-error` 无注释 | 同上 |
| `console.log` 留在生产代码中 | 开发调试完必须删除 |
| 注释掉的大段代码 | 删掉，Git 历史里有 |
| `TODO` 无负责人 + 日期 | 必须写 `// TODO(@username, YYYY-MM-DD): {具体要做的事}` |
| 硬编码的 secret / token | 必须走环境变量 |

---

## 与 loop-protocol 的关系

Auto Review 在 ④ VERIFY 阶段中，在自动检查（build/lint/tsc）之后、手动检查之前执行。

```
④ VERIFY:
  1. pnpm build          ← 阻止性
  2. pnpm typecheck      ← 阻止性
  3. pnpm lint           ← 阻止性
  4. Auto Review (本文件) ← 阻止性（❌ 项必须修复）
  5. pnpm format:check   ← 非阻止性（自动修复）
  6. pnpm test           ← 阻止性（如存在）
```
