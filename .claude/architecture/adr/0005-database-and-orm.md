---
status: stable
owner: architecture
last-updated: 2025-07-11
---

# ADR 0005: PostgreSQL + Drizzle ORM，评论自建

## 背景

内容管理方式需要最终确定：文章存哪、怎么存、评论怎么做。候选方案：文件系统 MDX、Headless CMS、数据库存 Markdown。

## 决策

1. **文章存 PostgreSQL**，正文为 **Markdown 原文**（TEXT 字段），渲染时由 `next-mdx-remote` 编译。
2. **ORM 用 Drizzle**（`pg` 驱动），不用 Prisma。
3. **评论自建**，存 PostGre（`comments` 表 + pending/approved/spam 审核流），否决 Giscus。
4. 表结构：`posts`（含 `tags TEXT[]`）+ `comments`（FK 级联删除），见 `src/lib/schema.ts`。

## 理由

1. **为什么数据库而非 MDX 文件？** 博客的写作场景是"在线编辑、随时发布、多状态管理"（draft/published/定时）。文件系统方案（MDX + git）需要本地编辑 + CI 部署流程，且无法做草稿/审核流。数据库方案让 Dashboard（Web 编辑器）成为可能，评论也天然在同一数据源。代价：丢失 git 版本管理文章的能力（迁移到 git 历史仍需文件导出），可接受。
2. **为什么 Markdown 原文而非 HTML？** 存储与渲染解耦——渲染层可以换（现在 next-mdx-remote，未来可换 react-markdown 或自定义渲染器），XSS 面最小（渲染时统一转义/过滤），与 MDX 文件方案的迁移路径一致。存 HTML 则相反：反序列化脆弱、XSS 风险散落在存储层。
3. **为什么 Drizzle 而非 Prisma？** Prisma 的抽象层重（schema 引擎 + query engine 二进制 + 额外 runtime），Drizzle 是 TypeScript 类型的 SQL 映射，零生成步骤、查询贴合 PostGre 能力（TEXT[]、unnest 等）。代价：Drizzle 没有 Prisma Studio 那样的 GUI，但 `drizzle-kit studio` 可用。
4. **为什么评论自建而非 Giscus？** Giscus 把评论托管在 GitHub Discussions——作者必须用 GitHub 账号，评论者也要 GitHub 账号，且内容脱离自己的数据库（无法统一管理、无法离线备份）。自建评论表 + 审核流（pending→approved/spam）让博客数据完全自主。代价：需要防垃圾评论（审核流 + 频率限制是基本盘）、评论功能需要自己开发（表单/列表/审核 UI）。
5. **为什么 `tags` 用 TEXT[] 而非关联表？** 博客标签低基数、无复杂关系。TEXT[] 免去 tag/post 关联表的 JOIN，PostGre 的 GIN 索引支持标签过滤。**触发迁移关联表的条件**：出现标签管理页（重命名、合并、按标签统计文章数）——届时迁移，记录为 tech-debt。

## 代价

1. **本地/部署需要数据库实例**：本地 Docker 起 PostGre（或 Neon 云实例），Vercel 部署需外部数据库（Neon/Supabase/自托管）——不再是无状态应用。
2. **缓存策略变化**：数据库直连不走 fetch Data Cache，需用 `unstable_cache` + `revalidateTag`（已落地于 `src/lib/posts.ts`）。
3. **文章无 git 版本历史**：数据库存储的版本管理依赖应用层实现（未来可在 posts 表加 revision 表）。

## 替代方案

| 方案 | 为什么不选 |
|------|-----------|
| MDX 文件（src/content/） | 无草稿/审核流，需本地编辑 + CI 部署，评论无法同源 |
| Headless CMS（Contentful/Sanity） | 外部依赖 + 付费墙 + 内容锁定；博客内容量级用数据库足够 |
| Prisma | 抽象层重、生成步骤多；Drizzle 更轻、更贴近 SQL |
| Giscus / Disqus | 评论数据脱离自有数据库，账号绑定第三方 |

## 生效日期

2025-07-11
