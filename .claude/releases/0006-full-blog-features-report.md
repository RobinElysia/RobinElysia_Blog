---
status: final
owner: review
last-updated: 2025-07-11
review-scope: v0.5.0 完整博客功能批次（阅读体验 + 发现性 + 全局页）
related-adr: []
---

# 审查报告 0006 — 完整博客功能批次

## 执行摘要

按"所有博客该有的功能"目标，完成阅读体验（代码高亮/Callout/图片放大/TOC/前后篇/相关文章）、发现性（分页/归档/关于）、基础设施（全局 404/error）三个维度。15 篇文章 seed 数据，生产验证 9/9 通过，过程中修复 3 个真 bug。

## 一、功能落地对照（roadmap 勾选）

| 功能 | 实现 | 验证 |
|------|------|------|
| 代码高亮 | shiki 自定义主题（黑白灰，CSS 变量跟随 .dark） | `var(--color-ink)` 在 HTML ✅ |
| Callout / 图片放大 | MDX components 映射 + client ZoomableImage | data-callout ✅ |
| TOC | extractHeadings + rehype-slug 锚点 + sticky 侧栏 | 目录/锚点 ✅ |
| 上一篇/下一篇 | getAdjacentPosts（SQL 时间相邻） | ✅ |
| 相关文章 | getRelatedPosts（tags 数组交集 &&） | ✅ |
| 分页 | getPostsPage（LIMIT/OFFSET + count） | 页1=10 篇 + 导航 ✅ |
| 归档页 | /archive 按年-月分组 | ✅ |
| 关于页 | /about（静态） | ✅ |
| 全局 404/error | not-found.tsx + error.tsx | 全局 404 ✅ |

## 二、过程中修复的 bug

1. **全局 loading.tsx 让 404 状态码回归 200**（v0.4.1 修复后复发）：app/loading.tsx 包裹全部路由（含 [slug]）。**决策：本项目全局不配 loading.tsx**（查询有 unstable_cache 兜底），组件级 Suspense 是替代。文档已更新。
2. **unstable_cache Date 序列化**：缓存命中后 publishedAt 从 Date 变 string，归档页 `getFullYear is not a function`。消费方统一 `new Date()`；tech-debt 记录"数据访问层应统一序列化日期为 string 类型标注"。
3. **shiki 4 移除 css-variables 主题**：编译时报 "Theme not included in bundle"。自建 `rezenkiCodeTheme`（tokenColors + CSS 变量色值）。

## 三、当前博客功能全景

```
✅ 阅读：列表/详情/标签/分页/前后篇/相关文章/TOC/高亮/Callout/图片放大/阅读时长/字数
✅ 发现：RSS/Sitemap/SEO metadata/归档/关于
✅ 互动：评论（提交+显示+审核流）
✅ 展示：黑白双模式/动效/大气布局/响应式
✅ 基建：PostGre+Drizzle/迁移/seed/全局 404/error
⬜ 创作：NextAuth + Dashboard（文章 CRUD + 评论审核）← 下一批次
⬜ 搜索：Flexsearch 客户端索引
```

## 四、已知待办

1. Dashboard 批次：NextAuth v5 + 文章 CRUD + 评论审核 UI + 标签管理
2. 全文搜索（Flexsearch，文章量 >50 时价值凸显）
3. 数据访问层日期字段统一 string 类型（tech-debt）
4. og:image（待品牌图定稿）

## 五、结论

"所有博客该有的功能"除创作端（Dashboard）与搜索外已全部具备。文档与代码自洽，三个 bug 的修复均已在对应文档记录踩坑规则。
