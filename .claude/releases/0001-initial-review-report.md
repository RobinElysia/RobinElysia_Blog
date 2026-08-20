---
status: review-snapshot
owner: review
last-updated: 2025-07-11
review-scope: .claude/ 全部文档
---

# REVIEW-REPORT — .claude 文档架构审查

## 第一步：结构完整性

### 1.1 孤儿文档检查

对比 `.claude/` 下实际文件与 `INDEX.md` 登记表：

| 检查项 | 结果 |
|--------|------|
| 实际 .md 文件数 | 40（含 INDEX.md） |
| 实际 .yaml 文件数 | 2（`api/openapi.yaml`、`api/versions/v1/openapi.yaml`） |
| INDEX.md 登记的 .md 文件 | 39（不含 INDEX 自身） |
| INDEX.md 登记的 .yaml 文件 | 2 |
| 孤儿文档（文件存在但索引未登记） | **0** ✅ |
| 死链（索引登记但文件不存在） | **0** ✅ |

### 1.2 元信息头检查

所有 `.md` 文件均包含 YAML frontmatter（`---` 起止），共 40 个文件。缺失清单：**0** ✅

但以下状态标记需要关注：

| 文件 | 当前 status | 说明 |
|------|-------------|------|
| 所有 ADR (0001-0004) | `draft` | 无实际决策内容，仍为占位 |
| `conventions/code-quality-and-refactor.md` | `draft` | 仍为占位 |
| `conventions/routing-conventions.md` | `draft` | 仍为占位 |
| `conventions/styling-conventions.md` | `draft` | 仍为占位 |
| `conventions/shared-core.md` | `draft` | 非 monorepo 场景可标记为 `not-applicable` |
| `conventions/commit-and-pr.md` | `draft` | 仍为占位 |
| `conventions/code-style/*.md` (2 个) | `draft` | 仍为占位 |
| `data-layer/client-state.md` | `draft` | 仍为占位 |
| `data-layer/streaming-and-suspense.md` | `draft` | 仍为占位 |
| `design/*` (4 个) | `draft` | 仍为占位 |
| `api/route-handlers.md` | `draft` | 仍为占位 |
| `testing/*` (4 个) | `draft` | 仍为占位 |
| `releases/CHANGELOG.md` | `draft` | 仍为占位 |
| `future/*` (2 个) | `draft` | 仍为占位 |
| `problem/*` (2 个) | `draft` | 仍为占位 |
| `onboarding/*` (1 个) | `draft` | 仍为占位 |

**结论**：40 个 md 文件中，**8 个已填充可执行内容**，**32 个仍为占位**。占位文件均满足"frontmatter + 一句话用途 + TODO"的骨架要求，不构成缺陷，但表明文档体系处于早期阶段。

---

## 第二步：内容一致性

### 2.1 ADR 与 conventions/data-layer 交叉检查

由于所有 ADR（0001-0004）仍为占位状态，无实际决策结论，不存在与 conventions/ 或 data-layer/ 矛盾的可能。此项检查在 ADR 填充后需重新执行。

### 2.2 已填充文档间一致性

| 检查对 | 结果 |
|--------|------|
| `architecture/rendering-strategy.md` ∪ `data-layer/caching-and-revalidation.md` | ✅ 一致。渲染策略文档为 blog 路由指定 ISR + revalidate 周期，缓存文档给出 matching 的 tag 命名规范。 |
| `architecture/data-flow.md` ∪ `data-layer/server-actions-contract.md` | ✅ 一致。data-flow.md 中的写链路示例与 server-actions-contract.md 中的 `{ ok, error }` 返回值约定完全对齐。 |
| `architecture/server-client-boundary.md` ∪ `conventions/component-conventions.md` | ✅ 一致。boundary 文档给出 `'use client'` 判断树，component-conventions 给出命名和导出规范，无冲突。 |
| `conventions/data-fetching-conventions.md` ∪ `data-layer/caching-and-revalidation.md` | ✅ 一致。fetch 默认行为、tag 命名、revalidate 策略均对齐。 |

### 2.3 跨文件矛盾

**无发现。** 当前已填充的 8 篇文档在技术决策上彼此自洽。

---

## 第三步：可执行性抽测

模拟"第一次接触本项目的 agent"，仅依赖 `.claude/` 文档回答以下场景（不看实际代码）：

### 场景 1：新增一个需要鉴权的动态路由页面

> "我要新增 `/dashboard/analytics` 页面，需要用户登录后才能访问，数据是每个用户个性化的。这个页面应该放在哪？layout 怎么嵌套？用 SSR 还是 ISR？"

**回答路径**：
1. `INDEX.md` → 必读顺序 → architecture/ → `app-router-map.md`
2. `app-router-map.md`：需鉴权页面放入 `(dashboard)` route group → `src/app/(dashboard)/analytics/page.tsx`
3. `app-router-map.md`：`(dashboard)/layout.tsx` 集中做登录检查 → layout 自动继承
4. `rendering-strategy.md`：数据个性化 + 依赖当前用户 → SSR

**结论**：✅ **通过**。跨 2 个文档即可得到明确、可执行的答案。

### 场景 2：给 Server Action 加错误处理

> "我要给 '删除文章' 的 Server Action 加错误处理，返回值格式应该是什么？客户端怎么消费？"

**回答路径**：
1. `INDEX.md` → data-layer/ → `server-actions-contract.md`
2. 返回值形状：`{ ok: false, error: "无权操作" }`
3. 客户端消费：`useActionState` + `result.ok === false` 判断 + `result.error` 展示
4. 附带鉴权模式：Server Action 内部自行鉴权，不依赖 Middleware

**结论**：✅ **通过**。单一文档即可获得完整答案（含代码示例）。

### 场景 3：判断组件是否需要 'use client'

> "我用 lucide-react 的图标组件做了一个导航栏，要不要标 'use client'？"

**回答路径**：
1. `INDEX.md` → architecture/ → `server-client-boundary.md`
2. 判断树：用了浏览器 API / 事件 / 第三方库？→ lucide-react 在黑名单中（内部用了 useState）
3. 拆分建议：图标抽为独立 Client Component（`nav-icon.tsx`），导航栏 layout 保持 Server Component
4. 反例展示：如果给整个 layout 标 `'use client'` 的后果（整棵子树失去 RSC 优势）

**结论**：✅ **通过**。判断树 + 黑名单 + 反例三层递进，覆盖决策全流程。

### 场景 4：数据获取失败的错误处理

> "我在 Server Component 里 fetch 文章列表，如果接口挂了怎么办？"

**回答路径**：
1. `INDEX.md` → conventions/ → `data-fetching-conventions.md`
2. 预期外错误：throw → `error.tsx` 捕获，不在组件内 try/catch
3. 预期内空结果：`if (posts.length === 0) return <EmptyState />`
4. 反例：try/catch 吞错误返回 null 的后果（静默失败）

**结论**：✅ **通过**。给出了明确的错误分类和对应的处理路径。

### 场景 5：数据修改后的缓存刷新

> "我通过 Server Action 修改了文章标题，文章详情页和首页都应该看到新标题。用什么 API？"

**回答路径**：
1. `INDEX.md` → data-layer/ → `caching-and-revalidation.md`
2. 影响多个页面 → 用 `revalidateTag("post:hello-world")`
3. 如果首页也有文章卡片且用了同一 tag → 一起刷新
4. 对比：`revalidatePath` 只能清一个页面，首页可能漏掉

**结论**：✅ **通过**。决策树 + 场景对比给出了精确的指导。

---

## 第四步：结论

### 整体评估

| 维度 | 评级 | 说明 |
|------|------|------|
| 结构完整性 | ✅ 通过 | 无孤儿文档、无死链、全部文件有元信息头 |
| 内容一致性 | ✅ 通过 | 已填充文档间无矛盾（ADRs 空置暂无法交叉检查） |
| 可执行性 | ✅ 通过 | 5/5 场景均可从文档获得明确答案 |
| 覆盖完整度 | ⚠️ 早期 | 仅 8/40 篇有可执行内容，其余 32 篇为占位 |

### 是否达到"可直接指导后续 agent 写代码"的标准？

**核心架构文档（已填充的 8 篇）已达到。** 一个 agent 可以仅凭这些文档完成路由组织、组件边界判断、数据获取、Server Action 编写、缓存策略制定。

**全局文档体系尚未达到。** 以下缺口会阻碍 agent 在特定领域工作：

1. **`conventions/routing-conventions.md`**（占位）— agent 不清楚私有文件夹和 route group 的使用边界，可能在 `(dashboard)/_components/` 和 `src/components/` 之间做错误选择。
2. **`design/loading-and-error-states.md`**（占位）— agent 不知道 loading.tsx / error.tsx / not-found.tsx 的统一规范，可能写出风格不一致的错误页面。
3. **`testing/test-strategy.md`**（占位）— agent 不知道测试分层策略和工具选择，写测试时可能在 Vitest 和 Jest 之间任意选择。
4. **`api/route-handlers.md`**（占位）— 如果项目有外部消费者需要 API，agent 不知道哪些 Handler 已存在、鉴权方式是什么。
5. **`conventions/commit-and-pr.md`**（占位）— agent 不知道 commit message 格式和 PR 模板要求。

### 行动建议

1. 项目进入实际开发后，**优先填充上述 5 个缺口文档**。
2. 做出第一个技术决策后，**立即填充 ADR-0001**（App Router 选型理由），建立 ADR 写作的先例。
3. 待数据源（数据库/CMS）确定后，更新 `system-overview.md` 的数据层部分和 `caching-and-revalidation.md` 中的集成方案。
4. `conventions/shared-core.md` 在确认为非 monorepo 后标记为 `status: not-applicable`，避免 agent 困惑。
5. 下次审查应在 **8 篇核心文档之外至少有 10 篇文档被填充** 后进行，重点复检 ADR 与 conventions/data-layer 的交叉一致性。
