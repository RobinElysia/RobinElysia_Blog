---
status: review-snapshot
owner: review
last-updated: 2025-07-11
review-scope: v0.6.0 测试基建、评论防刷、NextAuth + Dashboard、SEO 细节
related-adr: [0005]
---

# 审查报告 0007 — 创作端与质量基建批次

## 执行摘要

按建议顺序完成：测试基建（24 单测 + 5 E2E + CI）、评论防刷（ADR-0005 承诺落地）、NextAuth v5 + Dashboard 创作端、robots + JSON-LD。E2E 5/5 通过，过程中发现并修复 Next.js 16 的 revalidateTag breaking change。

## 一、落地对照

| 项 | 实现 | 验证 |
|----|------|------|
| vitest 单测 | feed/format/toc 24 用例 | 24/24 ✅ |
| Playwright E2E | 5 条核心流程（首页/详情/404/评论/Dashboard 重定向） | 5/5 ✅ |
| CI | GitHub Actions：postgres service + typecheck/lint/test/build/E2E | 配置就绪 |
| 评论防刷 | `rate-limit.ts` 滑动窗口（60s/3 次/IP） | 单元逻辑 + 接入 action ✅ |
| NextAuth v5 | GitHub + Credentials，`/login`，JWT session | E2E 重定向 ✅ |
| Dashboard | 概览统计 + 文章 CRUD（草稿/发布）+ 评论审核（approve/spam/delete） | build ✅ |
| robots.txt | 禁爬 /dashboard /login /api | build ✅ |
| JSON-LD | Article schema（headline/datePublished/author） | build ✅ |

## 二、发现并修复的 breaking change

**Next.js 16：`revalidateTag` 必须传第二个参数**（`revalidateTag(tag, "max")`，推荐 profile="max" 的 stale-while-revalidate 语义；单参形式已废弃且 TypeScript 类型强制双参）。项目此前无调用点未暴露，admin.ts 首次使用即报错。已修复全部 3 处调用 + 5 处文档示例（caching-and-revalidation/server-actions-contract/data-flow/rendering-strategy/task）。

## 三、E2E 调试记录

1. 首轮失败：Docker Desktop 未运行（ECONNREFUSED）→ 启动引擎 + 容器 + reseed
2. 断言歧义：页面 h1 与 MDX 正文 h1 重名（strict mode violation）→ 限定 `article header h1`
3. 断言文案错误：引用了 about 页的文案 → 改用 `.prose` 内实际内容
4. NextAuth UntrustedHost（E2E 端口 3011）→ `AUTH_TRUST_HOST=true`

## 四、tech-debt 更新

- ✅ 已解决：无测试基建（本轮补齐）、评论防刷（本轮实现）
- ⏳ 保留：unstable_cache 日期类型标注、shiki 色值硬编码

## 五、剩余工作

1. **部署上线**（Vercel：生产数据库 + AUTH_GITHUB_ID/SECRET + SITE_URL）——需要用户操作
2. 全文搜索（Flexsearch，文章 <50 价值有限）
3. og:image（待品牌图）
4. Dashboard 标签管理（TEXT[] → 关联表的触发条件）

## 六、结论

创作端（Dashboard）已打通"写文章 → 发布 → 审核评论"全流程，质量基建（单测 + E2E + CI）就位。博客功能全景：阅读 ✅ 发现 ✅ 互动 ✅ 创作 ✅ 基建 ✅——仅剩部署与搜索两个外围项。
