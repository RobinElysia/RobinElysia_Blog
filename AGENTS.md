<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Blog Project — Agent Entry Point

## 必读（每次 session 第一步）

1. **`.claude/INDEX.md`** — 文档总索引，了解全部文档的用途和必读顺序
2. **`.claude/loop-engine/loop-protocol.md`** — 五阶段 Agent 循环（READ → PLAN → ACT → VERIFY → ARCHIVE），所有代码修改必须走此流程
3. **`.claude/onboarding/how-agents-should-read-this-repo.md`** — 16 步阅读指南 + 修改代码前的文档映射表

## 核心约束

### 螺旋增量式更新

**每当你修改了代码，必须同步更新对应的 `.claude/` 文档。更新方式是融合（fusion），不是追加（append）。**

- 不要创建新的"补充说明"文件
- 不要在文档顶部追加段落
- 把新信息融入文档的对应位置，替换过时内容
- 保持文档自洽——改动了 A 段，检查 B 段是否需要同步
- 更新 `last-updated` 日期

**代码变更 → 文档更新的映射表**：见 `REASONIX.md` 第 4 节。

### Agent Loop 不可跳过

所有代码修改走 `loop-engine/loop-protocol.md` 的五阶段循环。快捷模式仅限以下全部满足：

1. 风险等级 = `low`
2. 只涉及 1 个文件
3. 不涉及数据流、auth、路由变更
4. 不新增依赖

不满足任一条 → 必须走完整五阶段。

### Auto Review 不可跳过

提交前逐条检查 `loop-engine/auto-review.md` 的六类清单。❌ 项必须修复。

### 文档优先于代码推断

- 不知道路由放在哪 → 查 `architecture/app-router-map.md`，不凭记忆推断
- 不知道组件要不要标 `'use client'` → 查 `architecture/server-client-boundary.md`
- 不知道 Server Action 返回值格式 → 查 `data-layer/server-actions-contract.md`
- 不知道 fetch 错误怎么处理 → 查 `conventions/data-fetching-conventions.md`

**禁止**在文档体系有覆盖的情况下，依赖训练数据中的"通用 Next.js 知识"做决策。

## 项目概况

- **类型**：个人博客
- **框架**：Next.js 16 + TypeScript strict + Tailwind CSS 4
- **内容**：MDX 文件（`src/content/`）
- **部署**：Vercel
- **详见**：`.claude/architecture/system-overview.md`
