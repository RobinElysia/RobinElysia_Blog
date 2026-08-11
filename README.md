# Blog

基于 Next.js 16 的个人博客。TypeScript strict + Tailwind CSS 4 + MDX。

## 快速开始

```bash
npm run dev       # 开发服务器 → http://localhost:3000
npm run build     # 生产构建
npm run lint      # ESLint 检查
npm run format    # Prettier 格式化
```

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS 4 |
| 内容 | MDX（`src/content/`） |
| 测试 | Vitest + Playwright |

完整技术雷达见 `.harness/future/tech-radar.md`。

## 项目结构

```
src/
├── app/           # App Router（路由、页面、布局）
├── components/    # 共享组件
├── lib/           # 工具函数和业务逻辑
├── actions/       # Server Actions
└── styles/        # 全局样式
.harness/          # ★ 项目文档与规范（核心）
```

## 开发者文档

本项目使用 `.harness/` 文档架构管理全部代码规范和技术决策。

- **新手入門**：先读 `.harness/onboarding/how-agents-should-read-this-repo.md`
- **文档总索引**：`.harness/INDEX.md`
- **架构说明**：`.harness/architecture/`
- **编码规范**：`.harness/conventions/`
- **任务管理**：`.harness/task/`
- **版本日志**：`.harness/releases/CHANGELOG.md`

## AI Agent 说明

本项目为 AI Agent 辅助开发设计。Agent 入門请读 `AGENTS.md`。核心规则：

- 所有代码修改必须走 `.harness/loop-engine/loop-protocol.md` 的五阶段循环
- 代码变动必须**融合更新**对应的 `.harness/` 文档（非追加）
- 详见 `REASONIX.md` 了解项目宪法

## 路线图

见 `.harness/future/roadmap.md`。

## 许可证

待定。
