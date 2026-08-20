---
status: review-snapshot
owner: review
last-updated: 2026-08-20
review-scope: Harness 文档体系与代码同步（S1-S5：路径/评论流/缓存/路由/工具链/一致性收口）
---

# 审查报告 0009 — Harness 文档-代码同步

## 执行摘要

以"代码为唯一事实源"，对 `.claude/` 文档体系完成五阶段同步（S1 路径统一 → S2 事实回填 → S3 工具链 → S4 一致性收口 → S5 验证归档）。全程走多智能体编排协议（Claude 分析 → DSH 执行 + Codex 每阶段独立审核 → 人类审查门 ×4 全部通过）。最终验证：`pnpm build` / `typecheck` / `lint`（0 error）/ `test`（30/30）全部通过；`.harness` 残留 0；INDEX 无孤儿文档。

## 一、背景（分析结论）

文档与代码在三次未同步的重构中脱钩：目录改名（731b4c4，.harness → .claude）、评论审核流下线（v0.7.0）、首页场景化改版（v0.12+）。文档停留在重构前世界观，矛盾渗透进源码注释（comment.ts/posts.ts），属 P0 级污染（agent 按文档会做出错误决策）。

## 二、五阶段改动清单

| 阶段 | 内容 | 关键产出 |
|------|------|----------|
| S1 | 全库 `.harness` → `.claude`（32 文件 101 处，含 AGENTS/CLAUDE/REASONIX/README/.env.example/src 注释）；源码注释幻觉修复（comment.ts 无审核流、posts.ts 统一 post-list）；空目录清理 | 残留 0；typecheck ✅ |
| S2 | 评论流四篇文档回填（无审核 + IP 限流 + 风险标注）；缓存 tag 统一 post-list（7 处）+ 带参查询模式；路由树按实测重画（16 路由，无 middleware/settings/loading）；system-overview 三表/无 Middleware/无 webhook | Codex 三轮审核通过（8 项问题全关闭） |
| S3 | 环境变量表 10 行与 .env.example 对齐（含 AUTH_GITHUB_ALLOWED_USERS 空=拒绝全部）；全库命令 pnpm 化（loop-engine/测试文档/PR 模板/README/playwright/package.json test:e2e）；eslint 5 条规则落地（lint 0 error；seed/migrate CLI 按例豁免）；测试数字 30/6 统一 | Codex 两轮审核通过 |
| S4 | REASONIX 状态枚举补 review-snapshot + 8 篇报告 frontmatter 统一；tech-radar 去矛盾补 7 项；roadmap 收敛（评论反垃圾风险项 + 优先级重排）；onboarding/README 按实测重画；.gitignore 加 .dsm/；tech-debt 补设计迁移条目；design 最小事实修正（用户授权：Giscus/token/场景化结论，含 DESIGN.md §1/§5 互指同步） | Codex 两轮审核通过 |
| S5 | 全库一致性验证（孤儿/残留/命令全过）；format 基线修复（openapi.yaml 语法、.prettierignore 补生成物）；本报告归档 | 见"三、验证" |

## 三、验证

| 检查项 | 结果 |
|--------|------|
| `.harness` 残留（排除 .git/.next/node_modules/.dsm/_md_output/test-results） | 0 命中 ✅ |
| INDEX 登记 vs 实际 .claude 文件 | 无孤儿文档 ✅ |
| `pnpm build` | ✅（Next 16.2.11，16 路由） |
| `pnpm typecheck` | ✅ |
| `pnpm lint`（含新增 5 条规则） | 0 error ✅（81 条 warn：explicit-function-return-type 74 + jsx-no-leaked-render 7，为渐进收敛目标） |
| `pnpm test` | 30/30 ✅ |
| `pnpm test:e2e -- --list` | 6 条 ✅ |
| `pnpm format:check` | ✅（圆桌修订 R4 已一次性收敛 87 文件存量漂移，此后全库合规；openapi.yaml 语法同步修复） |
| design 禁改区 | 仅用户授权的事实行被修正（Codex 逐行核对通过） |

## 四、已登记的技术债务 / 已知遗留

1. **设计定稿（暖纸五色 + EB Garamond）未落地代码**——DESIGN.md/visual-style-guide.md 已定稿（2026-08-19，frontmatter 已加 `implementation-status: pending`），globals.css 仍是黑白灰 token、layout.tsx 仍加载 Inter；用户自行迁移（tech-debt 已登记）。
2. **src/ 存量格式漂移**——已于圆桌修订 R4 一次性收敛（`pnpm format` 87 文件），CI 已接入 format:check 防复发。
3. **评论无内容审核**——roadmap 已补"评论反垃圾"风险项（唯一防线 IP 限流，内存实现，多实例失效）；圆桌决议②（评论治理 MVP）经用户否决，维持风险项。
4. **explicit-function-return-type 74 条 + jsx-no-leaked-render 7 条 warn**——auto-review A 类目标的渐进收敛项。

## 五、圆桌修订（第 1 轮决议，用户批准 ①③④）

| 决议 | 落地 |
|------|------|
| ① 防复发机制（A1+A2） | `scripts/harness-check.mjs` 防漂移门禁（禁用词/INDEX 孤儿/环境变量对齐/路由标注/契约陈旧 5 类检查）+ `pnpm harness:check` + CI job；REASONIX.md 写入「文档分层：契约层 vs 叙事层」 |
| ③ harness 自洽性（C3+C4+B4） | `.github/PULL_REQUEST_TEMPLATE.md` 落文件（取自 commit-and-pr 清单）；`pnpm format` 全库收敛（87 文件，纯格式，lint/typecheck/test 复验全绿）+ CI 接入 format:check；阶段拆分提交（C4）随本批次归档 |
| ④ 设计超前标记（C1） | DESIGN.md / visual-style-guide.md frontmatter 加 `implementation-status: pending`；globals.css / layout.tsx 顶部加指向 DESIGN.md 的迁移待办注释 |
| ② 评论治理 MVP | 用户否决（一票定音）——维持 roadmap「评论反垃圾」风险项；三位模型记录：上线前建议优先处理 |

## 六、结论

文档体系与代码实现达成一致（docs-first 可执行），索引、路径、命令、数字、设计事实全部对齐；五阶段 Codex 独立审核全部通过，人类审查门全部批准。遗留项均已登记且有主。
