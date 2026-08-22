# Blog

基于 Next.js 16 的个人博客（品牌 ReZenKi · 简约复古艺术风）。TypeScript strict + Tailwind CSS 4。

## 快速开始

```bash
pnpm install        # 安装依赖
pnpm dev            # 开发服务器 → http://localhost:3000
pnpm build          # 生产构建
pnpm typecheck      # 类型检查
pnpm lint           # ESLint 检查
pnpm test           # 单元测试（30 用例）
pnpm test:e2e       # E2E 测试（需本地 PostGre，见 e2e-testing.md）
pnpm format         # Prettier 格式化
```

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Next.js 16 (App Router, RSC) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS 4（黑白双模式 Design Token） |
| 数据库 | PostgreSQL + Drizzle ORM |
| 内容 | PostGre 存 Markdown 原文（详情页 next-mdx-remote + 统一渲染管线：LaTeX/Mermaid/代码高亮） |
| 评论 | 自建 PostGre（提交即显示 + IP 限流） |
| 鉴权 | NextAuth v5（GitHub 白名单 + Credentials，仅 Dashboard） |
| 测试 | Vitest（30 单测）+ Playwright（6 E2E） |

完整技术雷达见 `.claude/future/tech-radar.md`。

## 项目结构

```
src/
├── app/           # App Router（路由、页面、布局）
├── components/    # 共享组件（admin/、home/、motion/ 等）
├── lib/           # 数据访问层与工具（schema/db/posts/comments/mdx 管线）
└── actions/       # Server Actions（comment/admin）
e2e/               # Playwright E2E
drizzle/           # 数据库迁移
scripts/           # migrate.mjs（容器启动迁移）
.github/           # CI
.claude/           # ★ 项目文档与规范（Agent 核心参考源）
```

## 开发者文档

本项目使用 `.claude/` 文档架构管理全部代码规范和技术决策。

- **新手入門**：先读 `.claude/onboarding/how-agents-should-read-this-repo.md`
- **文档总索引**：`.claude/INDEX.md`
- **架构说明**：`.claude/architecture/`
- **编码规范**：`.claude/conventions/`
- **任务管理**：`.claude/task/`
- **版本日志**：`.claude/releases/CHANGELOG.md`

## AI Agent 说明

本项目为 AI Agent 辅助开发设计。Agent 入門请读 `AGENTS.md`。核心规则：

- 所有代码修改必须走 `.claude/loop-engine/loop-protocol.md` 的五阶段循环
- 代码变动必须**融合更新**对应的 `.claude/` 文档（非追加）
- 详见 `REASONIX.md` 了解项目宪法

## 路线图

见 `.claude/future/roadmap.md`。

## 部署

见 `DEPLOY.md`（Docker 生产部署）与 `.claude/architecture/runtime-and-deployment.md`。

## 许可证

待定。
