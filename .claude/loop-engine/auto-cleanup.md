---
status: stable
owner: loop-engine
last-updated: 2026-08-22
---

# 自动代码清理规则

Agent 在完成一个完整功能或修复后，必须执行代码清理。清理是独立于功能开发的步骤——不要在写功能时"顺便"清理无关代码，而是在功能完成且 VERIFY 通过后，专门跑一轮清理。

## 清理时机

```
功能完成 → VERIFY 通过 → ARCHIVE 完成 → [清理轮次] → 二次 VERIFY → 最终提交
```

清理轮次只做清理，不改业务逻辑。如果清理过程中发现需要重构的业务代码，记录为 tech-debt，不在本轮处理。

## 清理清单

### 1. 死代码移除

```bash
# 检测未被引用的导出（ts-prune 或 eslint-plugin-import）
pnpm exec ts-prune 2>&1
```

**规则**：
- 所有被 `ts-prune` 标记为 unused 的导出：检查是否确实无引用，如果是 → 删除
- 注释掉的代码块：直接删除（Git 历史可恢复）
- 只在一个地方使用的工具函数：内联到调用点，删除原函数

**不会清理的例外**：
- `page.tsx`、`layout.tsx`、`route.ts` — Next.js 通过文件系统路由引用，ts-prune 会误报
- `*.config.ts`（`next.config.ts`/`drizzle.config.ts`/`vitest.config.ts`/`playwright.config.ts` 等）的 `default` 导出 — CLI 引用，ts-prune 同样误报
- `next.config.ts` 中引用的模块
- Barrel export（`index.ts`）中 re-export 的模块
- **CLI 工具自身**：`ts-prune`、`depcheck` 及 config 文件引用类依赖（`tailwindcss`、`@testing-library/*`、`@types/*` 等）——depcheck 不会解析 config/脚本/类型文件引用，会把它们报为 unused；报 `missing` 的隐式依赖才需要处理

### 2. 未使用依赖清理

```bash
# 检查 package.json 中未使用的依赖
pnpm exec depcheck 2>&1
```

**规则**：
- `depcheck` 报告的 unused dependencies：确认后移除
- `depcheck` 报告的 missing dependencies（隐式依赖）：显式添加到 package.json
- `@types/*` 包与对应库同步：删除库时一起删除类型包

### 3. Import 整理

**规则**：
- 删除未使用的 import（ESLint 的 `no-unused-vars` 会报，但不会自动修复）
- 合并来自同一模块的 import：`import { a } from "x"; import { b } from "x"` → `import { a, b } from "x"`
- 按约定排序：外部依赖 → 内部模块 → 类型导入 → 样式

```ts
// ✅ 正确排序
import Image from "next/image";           // 外部（Next.js）
import { cn } from "@/lib/utils";         // 内部
import type { Post } from "@/types";      // 类型
import styles from "./post.module.css";   // 样式
```

### 4. 格式统一

```bash
pnpm format 2>&1
```

**规则**：直接运行格式化命令，不手动调整格式。Prettier 的配置（`.prettierrc`）是唯一标准。

### 5. 文件结构整理

- 检查是否有文件超过 **200 行**（不含测试）：如果超过，评估是否应拆分
- 检查是否有目录下超过 **15 个** 文件且无二级目录：如果超过，考虑按功能拆分子目录
- 检查 `src/components/` 下是否有只被一个路由使用的组件：如果可以，下沉到该路由的 `_components/`

---

## 清理后二次验证

清理完成后必须重新跑：

```bash
pnpm build && pnpm lint && pnpm format:check
```

清理引入新错误的概率虽然低（删代码不会引入新 bug，但删 import 可能删掉副作用导入），但仍需验证。

---

## 不应在清理中做的事

- ❌ 重命名变量/函数（属于重构，应走单独的 PLAN → ACT → VERIFY 循环）
- ❌ 改变函数签名（属于 API 变更，需要 ADR 或至少变更记录）
- ❌ 升级依赖版本（属于依赖管理，应单独 PR）
- ❌ 改动 `.claude/` 文档（除非清理的是文档本身的死链接）
