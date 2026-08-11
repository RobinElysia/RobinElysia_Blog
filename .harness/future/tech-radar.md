---
status: stable
owner: future
last-updated: 2025-07-11
---

# 技术雷达

## 当前采用

| 技术 | 用途 | 成熟度 |
|------|------|--------|
| Next.js 16 (App Router) | 全栈框架 | ✅ 生产可用 |
| React 19 (Server Components) | UI 渲染 | ✅ 生产可用 |
| TypeScript 5 (strict) | 类型系统 | ✅ 生产可用 |
| Tailwind CSS 4 | 样式方案 | ✅ 生产可用 |
| **PostgreSQL** | 数据库（posts/comments） | ✅ 生产可用 |
| **Drizzle ORM** | 数据访问（迁移 ADR-0005） | ✅ 生产可用 |
| **next-mdx-remote** | Markdown 正文渲染 | ✅ 生产可用 |
| **zod** | 输入校验（Server Action） | ✅ 生产可用 |
| **lucide-react** | 图标（'use client' 组件） | ✅ 生产可用 |
| ESLint 9 (flat config) | 代码检查 | ✅ 生产可用 |
| Prettier 3 | 代码格式 | ✅ 生产可用 |
| Vitest + Testing Library | 单元/组件测试 | ✅ 生产可用 |
| Playwright | E2E 测试 | ✅ 生产可用 |

## 试验中

| 技术 | 用途 | 风险点 |
|------|------|--------|
| — | — | 暂无 |

## 观望中

| 技术 | 潜力 | 观望原因 |
|------|------|----------|
| **Turbopack** (生产构建) | 10x 构建速度 | Next.js 16 的 Turbopack dev 已可用，生产构建仍在实验阶段 |
| **Partial Prerendering (PPR)** | 静态外壳 + 动态内容混合 | Next.js 标为 experimental |
| **React Compiler** (自动 memo) | 免手动 `useMemo`/`useCallback` | React 19 中可选，create-next-app 默认关闭；待生态验证 |
| **Biome** | 替代 ESLint + Prettier（单一工具、更快） | 生态系统尚未成熟，部分规则不如 ESLint 完善 |
| **Zustand v5** | 客户端状态管理 | 如 ADR-0003 所述，暂不需要全局状态库；需要时首选 |
| **Drizzle ORM** | 数据库 ORM（替代 Prisma） | ✅ 已采纳（ADR-0005），更轻量、更贴近 SQL |
| **Content Collections** (Next.js) | 内置 MDX 内容管理 | 已在 ADR-0005 否决——内容存 PostGre，不走文件系统 |

## 已放弃评估

| 技术 | 原因 |
|------|------|
| Pages Router | ADR-0001 已选 App Router |
| Redux | ADR-0003 已决定不加全局状态库 |
| CSS-in-JS (styled-components, Emotion) | RSC 兼容性差，Tailwind 已覆盖需求 |
| Giscus / Disqus | ADR-0005 已决定评论自建存 PostGre |
| Prisma | 过度抽象；ADR-0005 选用 Drizzle | 
