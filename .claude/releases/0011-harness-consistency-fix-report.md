---
status: review-snapshot
owner: review
last-updated: 2026-08-22
review-scope: Harness 文档体系自洽性修复（内容存储断言 / 工具名对齐 / 清理工具落地 / 门禁扩展）
---

# 审查报告 0011 — Harness 自洽性修复

## 执行摘要

对 `.claude/` harness 文档体系做自洽性审查，修复 0009 同步后仍残留的文档漂移：① 内容存储方式断言矛盾（入口文档与代码脱钩）；② loop-engine 引用的工具名与真实 harness 不一致；③ auto-cleanup 指定的 `ts-prune`/`depcheck` 未安装（按文档执行会失败）。修复后扩展 `harness-check.mjs` 门禁，将"内容存储断言漂移"固化为 CI 可检测项，防止回归。

## 一、发现的问题（审查结论）

| # | 问题 | 证据 | 级别 |
|---|------|------|------|
| 1 | **内容存储断言矛盾**：`AGENTS.md`（"内容：MDX 文件（src/content/）"）与 `runtime-and-deployment.md`（"文章以 MDX 文件存储在 src/content/"）声称内容存文件系统；实际文章/评论/图片均存 PostgreSQL（`posts.ts` 走 drizzle `db.select().from(posts)`，`src/content/` 目录不存在）。与 REASONIX/onboarding/ADR-0005 相矛盾 | 0009 后第四次同型脱钩 | P0 |
| 2 | **工具名不对齐**：loop-protocol 只写 Claude Code 工具名（`search_content`/`edit_file`/`multi_edit`/`write_file`），DSH 等 harness 无同名工具，agent 照抄会失败 | loop-protocol ①③ | P1 |
| 3 | **清理工具未安装**：auto-cleanup 指定 `pnpm exec ts-prune` / `pnpm exec depcheck`，两者均不在 devDependencies，命令必然失败 | 0009 S3 登记为"已落地"但实际未装 | P1 |

## 二、修复清单

| 文件 | 修复内容 |
|------|---------|
| `AGENTS.md` | 项目概况"内容"行改为 PostgreSQL `posts` 表存 Markdown 原文（drizzle 访问，`src/lib/mdx-options.ts` 渲染） |
| `.claude/architecture/runtime-and-deployment.md` | "为什么不放 Edge"三条理由融合改写：pg 驱动需 Node 原生模块（现况，删"未来如果"）+ MDX 编译管线包体积超 Edge 限制；删除过时的 fs/src/content 理由 |
| `.claude/loop-engine/loop-protocol.md` | READ 阶段搜索工具、ACT 阶段编辑工具补 harness 通用等价名（`search_content`/`grep`/`glob`，`edit_file`/`edit` 等） |
| `.claude/loop-engine/auto-cleanup.md` | 补 ts-prune/depcheck 误报例外：CLI 工具自身、config 文件 default 导出、config/脚本/类型文件引用类依赖（depcheck 不解析这些引用） |
| `scripts/harness-check.mjs` | 新增第 4 条禁用词检查：`MDX 文件[^。\n]{0,15}`?src/content/`（正面断言 = 漂移），豁免 releases 历史快照、ADR、脚本自身 |
| `src/lib/seed.ts` | 种子文章历史叙述"文章存在 src/content/"改为"文章放代码仓库文件目录"（防污染门禁，语义不变） |
| `package.json` + `pnpm-lock.yaml` | 安装 `ts-prune@0.10.3` + `depcheck@1.4.7` 为 devDependencies |
| `.claude/future/tech-radar.md` | "当前采用"登记 ts-prune（死代码检测）、depcheck（未使用/缺失依赖检测） |

## 三、验证

| 检查项 | 结果 |
|--------|------|
| `node scripts/harness-check.mjs` | 通过 ✅（162 文件，含新增内容存储断言检查） |
| `pnpm build` | ✅（Next 16.2.11；首次因 Google Fonts 网络拉取瞬时失败，重试通过——Inter/Italianno 加载为 0009 已登记的历史遗留） |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | 0 error ✅（100 warn 为存量 explicit-function-return-type 等渐进收敛项） |
| `pnpm test` | 30/30 ✅ |
| `pnpm exec ts-prune` / `pnpm exec depcheck` | 可执行 ✅（实测输出见 auto-cleanup 例外条目依据） |
| 我改动的 7 个文件 `prettier --check` | ✅ |

## 四、已登记的技术债务 / 已知遗留

1. **全库 `format:check` 存量漂移 13 文件**（docker-compose.yml、e2e/blog.spec.ts、next.config.ts、src/components/** 等）——本次未触碰，超出修复范围；其中 `scripts/harness-check.mjs` 已随本次修复格式化。按 loop-protocol 快捷模式边界，留待独立清理轮次处理。
2. **explicit-function-return-type 等 lint warn 存量**——0009 已登记的渐进收敛目标，延续。
3. **depcheck 对 config/脚本引用类依赖的误报**——已在 auto-cleanup 例外清单文档化，处理原则："确认后移除，报 missing 才需处理"。
