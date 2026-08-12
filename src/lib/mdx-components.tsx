import type { ComponentType } from "react";
import katex from "katex";
import { ZoomableImage } from "@/components/motion/zoomable-image";

/**
 * next-mdx-remote 的 components 映射类型。
 * 子组件 props 用宽松 Record 接受（MDX 组件 props 来自编译产物，类型不定）
 */
type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>;

/**
 * MDX 自定义组件映射（next-mdx-remote components 选项）
 * 用法：
 *   <Callout type="note">内容</Callout>
 *   <MathBlock>\int_0^1 x^2 dx</MathBlock>   ← 块级公式（服务端渲染，100% 可靠）
 *   <ZoomableImage src="/x.jpg" alt="..." />
 * 规范见 .harness/design/motion-and-interaction.md（黑白克制）
 */
export const mdxComponents: MDXComponents = {
  // 提示框：左侧粗线 + 浅底，黑白 token
  Callout: ({ type = "note", children }: { type?: string; children?: React.ReactNode }) => (
    <div className="my-6 border-l-2 border-ink bg-code px-5 py-4" data-callout={type}>
      <div className="text-xs font-medium tracking-[0.2em] text-muted uppercase">
        {type === "tip" ? "提示" : type === "warning" ? "注意" : "备注"}
      </div>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
  ),
  // 块级公式：```latex 代码块 → mathblock 组件（rehype-math-block 插件转换，文本 children 传递）
  mathblock: ({ children }: { children?: React.ReactNode }) => {
    const tex = String(children ?? "").trim();
    const html = katex.renderToString(tex, {
      displayMode: true,
      throwOnError: false,
    });
    return (
      <div
        className="my-8 overflow-x-auto py-2 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label={`公式：${tex}`}
      />
    );
  },
  // 图片：点击放大（client 组件，黑白 overlay）
  img: (props) => <ZoomableImage {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />,
};
