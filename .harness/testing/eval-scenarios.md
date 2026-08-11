---
status: stable
owner: testing
last-updated: 2025-07-11
---

# 评估场景

## 当前 Eval 策略

本项目初期不设自动化 eval 流程。代码质量由以下机制保证：

1. **TypeScript strict** + **ESLint** — 静态层面的正确性
2. **Auto Review** (`loop-engine/auto-review.md`) — Agent 每次修改的审查清单
3. **Code Review** — 人工 PR Review
4. **E2E 测试** — 关键用户流程

## 未来可引入的 Eval 场景

当以下条件满足时，评估本项目引入自动化 eval：

1. 博客积累了 **>50 篇文章**，手动检查渲染结果变得不现实
2. 评论区引入了 **AI 审核**（如过滤垃圾评论）→ 需要评估审核准确率
3. 搜索功能上线 → 需要评估搜索相关性

届时在本文档中补充具体的数据集、指标和评估脚本。

## Eval 文件结构（未来）

```
evals/
├── datasets/        # 评估数据集
├── metrics/         # 评估指标定义
├── scenarios/       # 评估场景
└── results/         # 历次评估结果
```
