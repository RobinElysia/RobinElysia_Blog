import { visit } from "unist-util-visit";

/**
 * rehype 插件：把 ```latex / ```math 代码块转换为 <mathblock tex="..."> 元素
 * （MDX 编译后 mathblock 组件由 mdxComponents.mathblock 渲染为 KaTeX 块级公式）
 *
 * 为什么不用 <MathBlock>children</MathBlock>：MDX 把 JSX 文本 children 中的 `{` 当
 * 表达式（acorn 解析失败，v0.7.0 踩坑）。代码块 + 属性传递零转义问题。
 * 必须在 rehype-pretty-code 之后执行（pretty-code 先输出 data-language 属性）。
 */

/** hast 最小类型（避免引入 hast/@types 依赖） */
type HastNode = {
  type: string;
  tagName?: string;
  children?: HastNode[];
  value?: string;
  properties?: Record<string, unknown>;
};

/** 递归提取所有文本（rehype-pretty-code 把文本包在 <span data-line> 里，不能只取直接 children） */
function extractText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(extractText).join("");
}

export function rehypeMathBlock() {
  return (tree: HastNode) => {
    visit(tree as never, "element", (node: HastNode) => {
      if (node.tagName !== "pre") return;
      const code = (node.children ?? []).find((c) => c.type === "element" && c.tagName === "code");
      if (!code) return;

      const props = (code.properties ?? {}) as Record<string, unknown>;
      // rehype-pretty-code 输出 data-language 属性（非 language-* class）
      const lang = props["data-language"];
      if (lang !== "latex" && lang !== "math") return;

      const text = extractText(code).trim();

      // 替换 pre 为 <mathblock>（公式作为文本子节点传递——
      // 属性含 `{` 会被 MDX 当 JSX 表达式，文本节点由库自动转义，v0.7.0 踩坑）
      // 保留 properties（空 className）——后续 rehype 插件（katex）会读 className
      node.tagName = "mathblock";
      node.properties = { className: [] };
      node.children = [{ type: "text", value: text }];
    });
  };
}
