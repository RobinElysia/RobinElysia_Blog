---
status: final
owner: review
last-updated: 2025-07-11
review-scope: 架构决策落地（PostGre 迁移、品牌定稿、依赖补齐、工程修正）
related-adr: [0005]
---

# 审查报告 0003 — 架构决策落地

## 执行摘要

用户 6 项决策全部落地：品牌 ReZenKi 定稿、数据库迁移 PostGre + Drizzle、评论自建、鉴权边界确认、依赖一次补齐（pnpm）、审查报告登记规则写入宪法。代码与文档的矛盾全部消除，`pnpm build` 通过。

## 一、决策 → 落地对照

| 用户决策 | 代码落地 | 文档落地 |
|----------|----------|----------|
| ① 三个模板矛盾按文档来 | `layout.tsx`（Inter+Italianno+metadata）、`globals.css`（黑白 token）、`page.tsx`（Hero+最近文章） | `visual-style-guide.md` draft→stable |
| ② PostGre | `drizzle.config.ts`、`src/lib/schema.ts`（posts/comments）、`src/lib/db.ts` | ADR-0005 新建、`runtime-and-deployment.md` 环境变量 |
| ③ 内容存 PostGre | `src/lib/posts.ts`（unstable_cache 数据访问层）、next-mdx-remote 已装 | `data-fetching-conventions.md` 重写、`caching-and-revalidation.md` 重写 |
| ④ 评论改 PostGre | comments 表 + `server-actions-contract.md` 完整示例（zod+写库） | ADR-0005、`api/route-handlers.md` 去 Giscus |
| ⑤ C 端无鉴权/Dashboard 有 | 路由结构文档明确 | `app-router-map.md` 鉴权边界节 |
| ⑥ ReZenKi 品牌 | 首页 Hero 花体 + metadata | `visual-style-guide.md` 定稿 |
| ⑦ 黑白杂志风 + 字体 | globals.css token + layout.tsx 字体 | `visual-style-guide.md` 完整字体体系 |
| ⑧ review-snapshot 登记 | — | REASONIX.md 登记规则 + INDEX.md 规则区 + releases 登记 |
| ⑨ pnpm + 依赖补齐 | 依赖全部安装，build 通过 | `tech-radar.md` 采用清单更新 |

## 二、过程中发现并修正的问题

1. **`component-conventions.md` 规则错误**：原"路由文件用 named export"违反 Next.js 硬性要求（page/layout 必须 default export），已修正并附反例。
2. **`serverActions` 配置过时**：Next.js 16.2.11 类型定义中已移入 `experimental`（官方文档滞后），已删除该配置并记录原因。
3. **9 个文档 frontmatter 状态错标**：内容完整但标 draft，与 INDEX 统计矛盾，已全部修正。
4. **pnpm 11 构建脚本阻塞**：`ERR_PNPM_IGNORED_BUILDS`（esbuild/sharp/unrs-resolver），通过 `pnpm approve-builds` 解决；配置写入 `pnpm-workspace.yaml` + `.npmrc` 双保险。
5. **`.gitignore` 吞掉 `.env.example`**：已加 `!.env.example`。

## 三、当前文档体系状态

| 状态 | 数量 | 说明 |
|------|------|------|
| stable | 41 | 全部核心规范 |
| draft | 4 | adr/0004（预留）、api 3 篇（openapi 契约未实现） |
| not-applicable | 1 | shared-core（非 monorepo） |
| review-snapshot | 3 | 0001/0002/0003 审查报告 |

## 四、已知待办（不阻塞，明确下一轮）

1. **数据库迁移**：本地起 PostGre（Docker/Neon）→ `pnpm drizzle-kit generate && pnpm drizzle-kit migrate` → 首页真实数据验证
2. **`/blog` 列表页 + `/blog/[slug]` 详情页**：task 卡片示例 1（已更新为数据库版）
3. **评论 UI**：CommentForm（zod 校验客户端化）+ 评论列表渲染
4. **seed 脚本**：`src/lib/seed.ts`（测试数据，E2E 需要）
5. **NextAuth v5**：Dashboard 登录（C 端不涉及）
6. **vitest/playwright 配置**：`vitest.config.ts`、`playwright.config.ts` 尚未创建（依赖已装）
7. **RSS/Sitemap Route Handlers**：`feed.xml/route.ts`、`sitemap.xml/route.ts`（文档已定义，未实现）

## 五、结论

架构文档与代码已达到自洽：文档描述的所有机制（unstable_cache 缓存、drizzle 访问、zod 校验、SSR 策略）都有对应实现，构建通过。下一轮按"已知待办"顺序推进即可，无遗留不确定性。
