/**
 * Seed 脚本 —— 插入示例文章/评论
 * 运行：pnpm seed
 */
import { db } from "./db";
import { posts, comments } from "./schema";

const now = new Date();

/** 生成 N 篇填充文章（测试分页/归档） */
function fillerPost(i: number) {
  return {
    slug: `filler-${i}`,
    title: `填充文章 ${i}：分页与归档测试`,
    excerpt: `这是第 ${i} 篇填充文章，用于验证分页、归档和搜索功能。`,
    content: `# 填充文章 ${i}

用于测试分页与归档的占位内容。

## 小节一

一些内容。

## 小节二

更多内容。`,
    tags: ["meta"],
    status: "published" as const,
    publishedAt: new Date(now.getTime() - i * 86400000),
  };
}

const samplePosts = [
  {
    slug: "hello-rezenki",
    coverImage: "/archive/hello-rezenki-wellcome-V0049797.jpg",
    title: "你好，ReZenKi",
    excerpt: "第一篇博客——关于这个网站的名字、风格，以及为什么开始写。",
    content: `# 你好，ReZenKi

**ReZenKi** 由 *ReZen* 与 *KiKi* 两个人组成。

## 名字的含义

ReZen 与 KiKi——两个人的名字，合在一起就是这个博客的名字。

## 风格

这个博客采用黑白简约杂志风格：无彩色强调、大量留白、意大利花体标题。

> 写作本身是克制，展示也是。

<Callout type="tip">
  这是 MDX 自定义组件示例：代码块可以用黑白灰高亮。
</Callout>

\`\`\`ts
const motto = "Less is more";

function greet(name: string): string {
  // 注释是灰的，关键字是深黑的
  return \`Hello, \${name}\`;
}
\`\`\`

欢迎来到这里。`,
    tags: ["meta", "hello"],
    status: "published" as const,
    publishedAt: now,
  },
  {
    slug: "why-postgres-for-blog",
    coverImage: "/archive/why-postgres-for-blog-wellcome-V0024913.jpg",
    title: "为什么博客要上 PostgreSQL？",
    excerpt: "从 MDX 文件到数据库：内容管理的架构决策记录（ADR-0005）。",
    content: `# 为什么博客要上 PostgreSQL？

## 背景

最初设想是 MDX 文件方案——文章放代码仓库文件目录，git 管理，CI 部署。

## 为什么改

1. **草稿流**：文件方案没有 draft/published 状态
2. **评论同源**：评论和文章在一个数据库里，管理统一
3. **在线编辑**：未来 Dashboard 的 Web 编辑器直接写库

## 代价

文章失去 git 版本历史；需要维护数据库。

详见 .claude/architecture/adr/0005-database-and-orm.md。`,
    tags: ["architecture", "postgres"],
    status: "published" as const,
    publishedAt: new Date(now.getTime() - 86400000),
  },
  {
    slug: "design-tokens-in-black-and-white",
    coverImage: "/archive/design-tokens-in-black-and-white-wellcome-V0024667.jpg",
    title: "黑白 Design Token：约束即风格",
    excerpt: "为什么黑白灰四色就够了？聊聊 token 设计与杂志风。",
    content: `# 黑白 Design Token：约束即风格

## 为什么不用彩色

彩色是注意力货币——全站只有黑白灰时，用户的注意力自然落在内容和排版上。

## Token 体系

- \`ink\`：正文与标题
- \`paper\`：页面背景
- \`muted\`：辅助文字
- \`line\`：分割线与边框

## 暗色模式的优雅

黑白反转即可，token 让双模式成为配置而不是重构。`,
    tags: ["design"],
    status: "published" as const,
    publishedAt: new Date(now.getTime() - 2 * 86400000),
  },
  {
    slug: "draft-black-white",
    title: "黑白杂志风：设计 Token 的克制（草稿）",
    excerpt: "一篇还在草稿箱里的文章，用来验证 draft 状态不可见。",
    content: `# 草稿示例

这篇文章不应出现在公开列表里。`,
    tags: ["design"],
    status: "draft" as const,
    publishedAt: null,
  },
  {
    slug: "latex-and-mermaid",
    coverImage: "/archive/latex-and-mermaid-wellcome-V0046512.jpg",
    title: "公式与图表：LaTeX 和 Mermaid 渲染示例",
    excerpt: "验证 KaTeX 公式与 Mermaid 图表在文章中的渲染。",
    content: `# 公式与图表

## 行内公式

质能方程 $E = mc^2$ 是行内公式。

## 块级公式（latex 代码块）

\`\`\`latex
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
\`\`\`

## Mermaid 流程图

\`\`\`mermaid
flowchart TD
  A[写作] --> B[编辑]
  B --> C[预览]
  C --> D[发布]
\`\`\`

## 时序图

\`\`\`mermaid
sequenceDiagram
  participant U as 读者
  participant S as 服务器
  U->>S: 访问文章
  S-->>U: 渲染 Markdown
\`\`\`
`,
    tags: ["meta", "tech"],
    status: "published" as const,
    publishedAt: new Date(now.getTime() - 3 * 86400000),
  },
];

async function main() {
  // eslint-disable-next-line no-console -- seed 是 CLI 脚本，进度输出是其职责
  console.log("🧹 清空现有数据...");
  await db.delete(comments);
  await db.delete(posts);

  // eslint-disable-next-line no-console -- 同上：CLI 进度输出
  console.log("📝 插入示例文章...");
  const fillers = Array.from({ length: 12 }, (_, i) => fillerPost(i + 1));
  for (const post of [...samplePosts, ...fillers]) {
    const [inserted] = await db.insert(posts).values(post).returning({ id: posts.id });
    // eslint-disable-next-line no-console -- 同上：CLI 进度输出
    console.log(`  ✓ ${post.slug} (id=${inserted.id})`);

    if (post.slug === "hello-rezenki") {
      await db.insert(comments).values({
        postId: inserted.id,
        authorName: "KiKi",
        content: "第一篇评论！欢迎来到 ReZenKi。",
        status: "approved",
      });
    }
  }

  // eslint-disable-next-line no-console -- 同上：CLI 完成提示
  console.log("✅ Seed 完成");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
