import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { PluggableList } from "unified";
import { robinElysiaCodeTheme } from "@/lib/code-theme";
import { rehypeMathBlock } from "@/lib/rehype-math-block";

/**
 * 统一 Markdown 渲染管线 —— 详情页（RSC/MDX）与编辑器预览（react-markdown）共用同一套插件
 * 保证"编辑器所见 == 最终渲染"
 * - LaTeX：remark-math（$...$/$$...$$）+ rehype-katex
 * - 代码高亮：rehype-pretty-code（黑白灰主题）
 * - 标题锚点：rehype-slug（TOC 依赖）
 * - Mermaid：由 <MermaidRenderer> 客户端扫描 ```mermaid 代码块渲染
 */

/** 详情页 MDX 编译（next-mdx-remote/rsc） */
export const mdxOptions: { remarkPlugins: PluggableList; rehypePlugins: PluggableList } = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [
    rehypeSlug,
    [rehypePrettyCode, { theme: robinElysiaCodeTheme, keepBackground: false }],
    rehypeMathBlock,
    rehypeKatex,
  ],
};

/** 编辑器预览（react-markdown，插件同源） */
export const previewRemarkPlugins: PluggableList = [remarkMath];
export const previewRehypePlugins: PluggableList = [
  rehypeSlug,
  [rehypePrettyCode, { theme: robinElysiaCodeTheme, keepBackground: false }],
  rehypeMathBlock,
  rehypeKatex,
];
