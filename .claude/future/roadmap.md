---
status: stable
owner: future
last-updated: 2025-07-11
---

# 路线图

> 目标：**完整博客**——阅读、发现、创作、分发四大能力全部具备。

## 功能总览（打勾 = 已完成）

### 阅读体验
- [x] 文章列表（`/blog`）
- [x] 文章详情（`/blog/[slug]`，SSR + unstable_cache）
- [x] 标签筛选（`/blog?tag=`）
- [x] 阅读时长 + 字数统计
- [x] 黑白双模式（手动切换 + 跟随系统）
- [x] MDX 渲染（next-mdx-remote）
- [x] 代码块语法高亮（黑白灰 shiki 自定义主题）
- [x] Callout / 图片放大 / 自定义 MDX 组件
- [x] 文章目录 TOC（桌面 sticky 侧栏）
- [x] 上一篇 / 下一篇导航
- [x] 相关文章推荐（同标签）
- [x] 分页（每页 10 篇）
- [x] LaTeX 公式（行内 + 块级）与 Mermaid 图表
- [x] 编辑器增强（工具条 + 实时预览）
- [x] 正文排版间距优化

### 发现性
- [x] RSS Feed（`/feed.xml`）
- [x] Sitemap（`/sitemap.xml`）
- [x] SEO metadata（title/description/keywords，按文章生成）
- [x] 文章归档页（按年月分组）
- [x] 关于页（/about）
- [ ] 全文搜索（Flexsearch 客户端索引）
- [ ] og:image（发布时生成）
- [x] 站点级 SEO 完善（robots.txt + Article JSON-LD）

### 互动
- [x] 评论系统（自建 PostGre；v0.7.0 起**无审核流**，提交即显示）
- [x] 评论表单（zod 校验 + useActionState + IP 防刷）
- [x] ~~评论审核 UI~~（已移除——用户决策：评论不需要审核）
- [x] 评论防刷（IP 滑动窗口限流）

### 创作与管理
- [x] NextAuth v5 登录（GitHub + Credentials，仅 Dashboard）
- [x] Dashboard：文章 CRUD（草稿/发布）+ 评论审核
- [ ] 标签管理（Dashboard 内，TEXT[] 迁移关联表的触发条件）
- [ ] 图片优化（next/image blur placeholder）

### 基础设施
- [x] 数据库（PostGre + Drizzle + 迁移 + seed）
- [x] 全局导航（滚动毛玻璃 + 主题切换）
- [x] 404（文章级 + 全局）
- [x] 全局 error.tsx
- [x] 测试基建（vitest 24 单测 + playwright 5 E2E）
- [x] CI（GitHub Actions：lint + typecheck + test + build + E2E）
- [ ] 部署（Vercel：生产数据库 + 环境变量 + SITE_URL）

## 已放弃（记录原因）

- Newsletter：个人博客现阶段无邮件订阅需求（保留为长期候选）
- 多语言：内容以中文为主，暂不做 i18n
- 浏览量公开统计：无鉴权防刷手段前不做公开数字（可做 Dashboard 内部统计）

## 优先级排序依据

1. **创作端**（Dashboard）是当前最大缺口——评论审核卡在 pending、文章只能靠 seed/psql 写入
2. **测试基建**次之——纯函数（feed/format/toc）是零成本测试对象
3. **部署**——代码已在功能完备状态，上线才有意义
4. 搜索在文章量 <50 时价值有限，可后置
