---
status: review-snapshot
owner: review
last-updated: 2025-07-11
review-scope: v0.7.0 编辑器增强、LaTeX/Mermaid 渲染、排版优化、评论去审核
related-adr: [0005]
---

# 审查报告 0008 — 编辑器与渲染增强批次

## 执行摘要

三需求全部落地：①编辑器增强（工具条 + 预览 Tab + LaTeX/Mermaid）②正文排版间距优化 ③评论去审核流。验证：LaTeX 行内/块级、Mermaid 代码块、单测 24/24、E2E 5/5 全通过。过程中踩了 3 个 MDX 管线深坑并全部记录。

## 一、需求落地

### ① 编辑器增强（`src/components/admin/post-form.tsx`）

| 能力 | 实现 |
|------|------|
| 工具条 12 按钮 | H2/H3/粗体/斜体/链接/图片/代码/公式/公式块/Mermaid/引用/表格，selection 感知插入 |
| 图片插入 | 插入 `![描述](URL)` 语法（URL 粘贴式，无上传存储） |
| 标题渲染 | 预览 Tab 实时渲染 Markdown 标题 |
| 预览 | react-markdown + 与详情页**同源插件管线**（KaTeX/代码高亮/Mermaid）——所见即所得 |
| 统一管线 | `src/lib/mdx-options.ts`（mdxOptions + preview 插件，双端共用） |

### ② 排版优化（globals.css prose 定制）

标题（h2 上边框 + 3em）、段落 1.5em、代码块/引用/表格 2em 间距；字间距未动。

### ③ 评论去审核

`submitComment` 直接 `status: "approved"`，移除 Dashboard 评论审核页 + 审核 actions。schema 的 status 列保留（兼容历史数据）。

## 二、MDX 管线三个深坑（全部已记录）

| 坑 | 现象 | 解法 |
|----|------|------|
| `$$` 多行块级在 MDX 中被行内化 | remark-math 纯管线识别块级，MDX 管线失败 | 弃用 `$$` 块级，改用 ` ```latex ` 代码块 + 自定义 rehype-math-block 插件 |
| `<MathBlock>{...}</MathBlock>` 的 `{` 被当表达式 | acorn "Could not parse expression" | 插件生成**文本子节点**传公式（库自动转义），组件读 children |
| rehype-pretty-code 输出 `data-language` 属性 | 插件按 `language-*` class 检测失效 | 按 `data-language` 属性检测 |
| 附：删 properties 导致后续插件崩溃 | katex 读 className undefined | 保留空 `{ className: [] }` |

**文档落点**：`data-layer/` 无——渲染管线归 `design/` 与 `conventions/`；踩坑规则写入 `visual-style-guide.md`（公式/图表写法约定）。

## 三、验证

- LaTeX 行内 `$E=mc^2$` ✅（class="katex"）
- LaTeX 块级（latex 代码块 → katex-display + aria）✅
- Mermaid 代码块 ✅（data-language="mermaid"，客户端动态加载）
- 单测 24/24 ✅ E2E 5/5 ✅

## 四、约定变更（写文章的人需要知道）

```
行内公式：$E = mc^2$
块级公式：```latex
          \int_0^1 x^2 dx
          ```
Mermaid 图表：```mermaid
          flowchart TD
            A --> B
          ```
（编辑器工具条可一键插入）
```

## 五、结论

编辑器具备完整 Markdown 创作能力（含公式与图表预览），正文排版拉开透气，评论即发即显。MDX 管线三个坑的解法已固化为文档约定，后续写公式不再踩。
