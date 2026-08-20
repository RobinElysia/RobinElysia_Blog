<!-- 本模板与 .claude/conventions/commit-and-pr.md 的 PR 检查清单保持一致（2026-08-20 落文件，圆桌决议 C3） -->

## 变更说明
<!-- 一句话总结 -->

## 关联文档
- [ ] 涉及 `.claude/` 变更？如是，列出修改的文件：
- [ ] 需要新 ADR？如是，附上 ADR 编号：
- [ ] 需要更新 CHANGELOG？如是，已更新 `.claude/releases/CHANGELOG.md`
- [ ] 涉及契约文档（路由树/环境变量/缓存 tag/Server Action 契约）？如是，已跑 `pnpm harness:check`

## 检查清单
- [ ] 代码通过 `pnpm build`
- [ ] 代码通过 `pnpm lint`
- [ ] 代码通过 `pnpm format:check`
- [ ] 类型检查通过 `pnpm typecheck`
- [ ] Auto Review 清单已逐条检查（见 `loop-engine/auto-review.md`）
- [ ] 新增代码有对应的测试（如涉及业务逻辑）
- [ ] 无 `console.log` / `@ts-ignore` / 注释掉的大段代码

## 风险等级
<!-- low / med / high，附一句话说明 -->
