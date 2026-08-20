---
status: stable
owner: task
last-updated: 2026-08-20
---

# 任务管理

## 目录说明

- `backlog/` — 待排期的任务卡片（未决定何时做）
- `active/` — 当前迭代进行中的任务卡片（最多 3 张同时在 active）

## 任务卡片格式

每张任务卡片是一个独立的 `.md` 文件，命名格式 `YYYY-MM-DD-{slug}.md`。**三项要素缺一即为不合格任务卡**：

### 模板

```markdown
---
status: backlog | active | done
priority: high | medium | low
owner: @username
created: YYYY-MM-DD
target: YYYY-MM-DD  # 预计完成日期
related-docs:       # 改动前必读的 .claude/ 文档路径
  - architecture/xxx.md
  - conventions/xxx.md
---

# {任务标题}

## 目标

{一句话描述这个任务完成后用户/开发者能做什么}

## 背景

{为什么需要这个任务？相关的用户反馈、技术债务、产品需求}

## 涉及的 .claude 文档（改动前必读）

- `.claude/architecture/app-router-map.md` — 确认路由放置位置
- `.claude/architecture/rendering-strategy.md` — 确认渲染模式
- `.claude/conventions/data-fetching-conventions.md` — 确认 fetch 约定

## 涉及的文件（预计）

- `src/app/(marketing)/blog/page.tsx`
- `src/components/post-card.tsx`
- `src/lib/posts.ts`

## 验收标准

- [ ] {可验证的条件 1}
- [ ] {可验证的条件 2}
- [ ] {可验证的条件 3}

## 技术要点

{关键的实现细节、边界条件、反直觉的地方}

## 相关链接

- 关联 Issue：#{number}
- 关联 ADR：{nnnn}
- 参考设计稿：{Figma 链接}
```

### 验收标准的写法

验收标准必须是**可验证的**。判断标准：一个人不看代码、只按验收标准逐条测试，能否判断任务是否完成。

```markdown
# ✅ 好的验收标准
- [ ] 访问 /blog 能看到文章列表，每篇显示标题、日期、摘要
- [ ] 文章超过 10 篇时，页面底部出现"加载更多"按钮
- [ ] 点击"加载更多"，追加 10 篇文章，原有文章不刷新
- [ ] 无网络时显示"加载失败，请检查网络连接"
- [ ] 空状态时显示"还没有文章" + 插图

# ❌ 差的验收标准
- [ ] 实现文章列表页面          ← 太模糊，无法验证
- [ ] 代码整洁                  ← 不可验证的主观判断
- [ ] 性能良好                  ← 没有量化指标
```

## 示例任务卡片

以下三张卡片是真实可参考的示例，展示了完整的格式和约束。

### 示例 1：新增博客首页

```markdown
---
status: active
priority: high
owner: @dev
created: 2025-07-11
target: 2025-07-14
related-docs:
  - architecture/app-router-map.md
  - architecture/rendering-strategy.md
  - conventions/data-fetching-conventions.md
  - conventions/component-conventions.md
  - design/layout-patterns.md
---

# 博客首页：文章列表 + 分页

## 目标

访问 /blog 看到按日期倒序排列的文章列表，包含分页。

## 背景

博客需要展示所有已发布文章。这是 MVP 的核心页面。数据源为 PostgreSQL（`posts` 表，Markdown 原文存 `content` 字段）。

## 涉及的 .claude 文档（改动前必读）

- `.claude/architecture/app-router-map.md` — 确认放在 `(marketing)/blog/`
- `.claude/architecture/rendering-strategy.md` — blog 列表 SSR + unstable_cache
- `.claude/conventions/data-fetching-conventions.md` — 数据读取走 src/lib/，错误处理规范
- `.claude/conventions/component-conventions.md` — PostCard 组件的命名和结构
- `.claude/design/layout-patterns.md` — 列表布局 max-w-2xl
- `.claude/architecture/adr/0005-database-and-orm.md` — 数据库架构背景

## 涉及的文件（预计）

- `src/app/(marketing)/blog/page.tsx` — 博客首页（Server Component）
- `src/app/(marketing)/blog/loading.tsx` — 加载骨架
- `src/app/(marketing)/blog/error.tsx` — 错误状态
- `src/components/post-card.tsx` — 文章卡片（Server Component）
- `src/lib/posts.ts` — 已存在（getPublishedPosts 带分页参数）

## 验收标准

- [ ] 访问 /blog 看到文章列表（标题、日期、摘要），按日期倒序
- [ ] 日期格式为 "2025年7月11日"
- [ ] 每页显示 10 篇文章
- [ ] URL 参数 `?page=2` 跳转到第二页
- [ ] `/blog` 和 `/blog?page=1` 显示相同内容
- [ ] `?page=999` 超出范围时显示"没有更多文章"
- [ ] 无文章时（posts 表为空）显示 EmptyState
- [ ] 文章标题超过 80 字符时，用 CSS line-clamp 截断为两行
- [ ] 页面通过 Lighthouse 性能审计（Performance ≥ 90）
- [ ] `pnpm build` 通过，`pnpm lint` 通过

## 技术要点

1. 列表查询只 select 元数据列（id/slug/title/excerpt/tags/publishedAt），
   不读 content 大字段——分页列表的 SQL 应带 OFFSET/LIMIT。
2. 分页通过 URL search params（`?page=N`）实现，不使用客户端状态。
3. `getPublishedPosts` 已用 unstable_cache 包装（tag: post-list），
   发布新文章后 Server Action 里 revalidateTag("post-list", "max") 立即生效。
4. PostCard 只需展示标题 + 日期 + 摘要，不需要图片。
   如有图片需求，在后续迭代中作为单独的 task。

## 相关链接

- ADR-0001（App Router 选型）
- ADR-0005（PostGre + Drizzle）
- `architecture/rendering-strategy.md`（SSR + unstable_cache）
```

### 示例 2：暗色模式

```markdown
---
status: backlog
priority: medium
owner: unassigned
created: 2025-07-11
target: TBD
related-docs:
  - design/visual-style-guide.md
  - design/responsive-and-a11y.md
  - conventions/styling-conventions.md
---

# 暗色模式：跟随系统 + 手动切换

## 目标

页面支持亮色/暗色两种主题，默认跟随系统偏好，用户可在 Header 中手动切换。

## 背景

暗色模式是现代网站的标配。视觉风格指南已定义了两套 Design Token 值。

## 涉及的 .claude 文档（改动前必读）

- `.claude/design/visual-style-guide.md` — 已定义好的暗色 Design Token
- `.claude/design/responsive-and-a11y.md` — 对比度要求
- `.claude/conventions/styling-conventions.md` — Dark mode 实现策略

## 涉及的文件（预计）

- `src/app/globals.css` — 添加 `prefers-color-scheme` 媒体查询
- `src/components/theme-toggle.tsx` — Client Component，切换按钮

## 验收标准

- [ ] 系统为亮色模式时，页面显示亮色主题
- [ ] 系统为暗色模式时，页面显示暗色主题
- [ ] Header 中有切换按钮，点击可在亮/暗之间切换
- [ ] 切换状态持久化（localStorage），刷新后保持
- [ ] 文章正文在暗色模式下的对比度 ≥ 4.5:1
- [ ] 代码块在暗色模式下可读（不刺眼也不暗淡）
- [ ] 无闪烁：首次加载时不会先显示亮色再切换暗色
  （通过在 `<html>` 中注入 script 避免 FOUC）

## 技术要点

1. 初始方案不引入 `next-themes`——先用原生 CSS `prefers-color-scheme` +
   `<html>` class 切换 + `localStorage`。当需要 SSR 正确渲染暗色主题时再评估 `next-themes`。
2. 主题切换按钮图标：亮色时显示月亮图标，暗色时显示太阳图标。
   （lucide-react 中的 `Moon` 和 `Sun` 组件——注意要抽成独立 Client Component。）
3. Tailwind 的 `dark:` 前缀默认依赖 `prefers-color-scheme`，
   不依赖手动 class。需要在 `tailwind.config` 中改为 `class` 策略。

## 相关链接

- `design/visual-style-guide.md`（Token 定义）
- ADR-0003（已决定不引入 Zustand，暗色模式状态用 localStorage + context 管理）
```

### 示例 3：RSS Feed

```markdown
---
status: backlog
priority: medium
owner: unassigned
created: 2025-07-11
target: TBD
related-docs:
  - architecture/rendering-strategy.md
  - api/route-handlers.md
---

# RSS Feed 生成

## 目标

访问 `/feed.xml` 返回 RSS 2.0 格式的 XML，包含最近 20 篇文章。

## 背景

RSS 是博客分发的核心渠道。需要从 MDX frontmatter 读取文章元数据，拼接成 RSS XML。

## 涉及的 .claude 文档（改动前必读）

- `.claude/api/route-handlers.md` — RSS 走 Route Handler（因为需要返回 XML）
- `.claude/architecture/rendering-strategy.md` — RSS 不缓存（每次请求读最新文章列表）

## 涉及的文件（预计）

- `src/app/feed.xml/route.ts` — Route Handler，生成 RSS XML
- `src/lib/feed.ts` — RSS XML 生成逻辑（纯函数，可测试）
- `src/lib/feed.test.ts` — RSS 生成单元测试

## 验收标准

- [ ] 访问 /feed.xml 返回 Content-Type: application/rss+xml
- [ ] XML 包含最近 20 篇文章的 title、link、description、pubDate
- [ ] pubDate 格式为 RFC 822（如 `Fri, 11 Jul 2025 00:00:00 +0000`）
- [ ] 文章少于 20 篇时，返回全部文章
- [ ] XML 中没有非法字符（MDX frontmatter 中的 `&`、`<`、`>` 被转义）
- [ ] 单元测试覆盖：正常生成、空文章列表、特殊字符转义
- [ ] `pnpm lint` 通过

## 技术要点

1. 不要引入 RSS 生成库（如 `rss` npm 包）——RSS 2.0 的 XML 结构很简单，
   手写模板字符串即可，省一个依赖。
2. Route Handler 中使用 `new Response(xml, { headers: { "Content-Type": "application/rss+xml" } })`。
3. 文章内容截取前 200 字符作为 description（去除 Markdown 语法）。

## 相关链接

- [RSS 2.0 规范](https://www.rssboard.org/rss-specification)
```

## 任务状态流转

```
backlog ──→ active ──→ done
  ↑                      │
  └──────── rejected ────┘
```

- `backlog → active`：开发者认领任务，设 `target` 日期
- `active → done`：全部验收标准通过 + Auto Review 通过 + PR 合并
- `active → backlog`：任务被阻塞，退回到 backlog（在任务卡片中注明阻塞原因）
- `active → rejected`：任务被取消（保留卡片但标记为 rejected）
