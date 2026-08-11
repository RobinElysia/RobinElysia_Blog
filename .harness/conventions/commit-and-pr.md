---
status: stable
owner: conventions
last-updated: 2025-07-11
---

# Commit 与 PR 规范

## Commit Message 格式

采用 [Conventional Commits](https://www.conventionalcommits.org/) 1.0.0：

```
<type>(<scope>): <subject>

[body]

[footer]
```

### Type

| Type | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(blog): add RSS feed generation` |
| `fix` | Bug 修复 | `fix(auth): handle expired token redirect` |
| `refactor` | 重构（不改变功能） | `refactor(db): extract query builder` |
| `docs` | 文档变更 | `docs(harness): fill routing conventions` |
| `style` | 格式变更（Prettier/ESLint 自动修复） | `style: apply Prettier formatting` |
| `test` | 测试变更 | `test(blog): add snapshot tests for PostCard` |
| `chore` | 构建/工具/依赖 | `chore(deps): upgrade Next.js to 16.3` |
| `perf` | 性能优化 | `perf(images): add blur placeholder to thumbnails` |

### Scope

可选，用受影响的模块名：`blog`、`auth`、`dashboard`、`db`、`harness`、`deps`。

### Subject

- 中文或英文均可，但一个项目内保持一致
- ≤ 72 字符
- 不以句号结尾
- 祈使语气："添加"而非"添加了"；"add"而非"added"

### Body（可选）

- 解释 **为什么** 要做这个改动（动机）
- 解释 **怎么做** 的（方案简述）
- 不重复 diff 能看出来的内容

### Footer（可选）

- `BREAKING CHANGE:` — 标记破坏性变更
- `Closes #123` — 关联 Issue
- `Reviewed-by: @username`

## PR 模板

每个 PR 必须包含以下检查项，在 PR 描述中以 checklist 形式呈现：

```markdown
## 变更说明
<!-- 一句话总结 -->

## 关联文档
- [ ] 涉及 `.harness/` 变更？如是，列出修改的文件：
- [ ] 需要新 ADR？如是，附上 ADR 编号：
- [ ] 需要更新 CHANGELOG？如是，已更新 `.harness/releases/CHANGELOG.md`

## 检查清单
- [ ] 代码通过 `npm run build`
- [ ] 代码通过 `npm run lint`
- [ ] 代码通过 `npm run format:check`
- [ ] 类型检查通过 `npx tsc --noEmit`
- [ ] Auto Review 清单已逐条检查（见 `loop-engine/auto-review.md`）
- [ ] 新增代码有对应的测试（如涉及业务逻辑）
- [ ] 无 `console.log` / `@ts-ignore` / 注释掉的大段代码

## 风险等级
<!-- low / med / high，附一句话说明 -->
```

## ADR / CHANGELOG 联动规则

| 变更类型 | ADR | CHANGELOG |
|----------|-----|-----------|
| `feat`（新增功能） | 如果引入了新的架构决策 → 写 ADR | 必须更新 |
| `fix`（Bug 修复） | 不需要 | 可选（影响用户行为的 Bug 才写） |
| `refactor`（重构） | 如果改变了公共 API → 写 ADR | 标记为 breaking change |
| `docs` | 不需要 | 不需要 |
| `BREAKING CHANGE` | 必须写 ADR | 必须更新 |

## 分支命名

```
{type}/{简短描述}
```

示例：`feat/rss-feed`、`fix/auth-redirect`、`refactor/db-query`。

不在分支名中使用数字 ID（`feat/123`），数字 ID 放在 PR 关联的 Issue 中。
