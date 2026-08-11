"use client";

import { useEffect } from "react";

/**
 * Mermaid 图表渲染 —— 客户端扫描 ```mermaid 代码块并渲染为 SVG
 * - 纯客户端（mermaid 需要 DOM）
 * - 黑白主题：themeVariables 必须传**实际颜色值**（mermaid 颜色解析器
 *   不支持 CSS 变量字符串 var(--color-*)——v0.7.1 踩坑），用 getComputedStyle 解析
 * - 整体 try/catch：单图表失败不拖垮页面
 */
export function MermaidRenderer() {
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        // rehype-pretty-code 把代码块转成 data-language 属性（非 language-mermaid class）
        const blocks = document.querySelectorAll<HTMLElement>(
          'pre > code[data-language="mermaid"]',
        );
        if (blocks.length === 0) return;

        // 动态加载 mermaid（仅页面含 mermaid 时加载，减小首屏 JS）
        const mermaid = (await import("mermaid")).default;
        if (cancelled) return;

        // 使用 mermaid neutral 主题默认配色（v0.7.4 回滚全部自定义颜色）。
        // 注意：不能传 themeVariables 的 CSS 变量/oklch 值——mermaid 颜色解析器不支持（v0.7.1 踩坑）
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
        });

        blocks.forEach((code) => {
          const pre = code.closest("pre");
          if (!pre) return;
          const source = code.textContent ?? "";

          // 占位：渲染前的灰色图表占位
          pre.innerHTML =
            '<div class="flex min-h-24 items-center justify-center border border-line text-xs text-muted">图表渲染中…</div>';

          // 直接操作 pre 引用（不依赖 getElementById——mermaid 11 的 id 插入行为不可靠，v0.7.1 踩坑）
          mermaid
            .render(`mermaid-g-${Math.random().toString(36).slice(2, 9)}`, source)
            .then(({ svg }) => {
              pre.innerHTML = svg;
            })
            .catch((err) => {
              pre.innerHTML = `<pre class="p-4 text-xs text-muted">Mermaid 渲染失败：${String(err)}</pre>`;
            });
        });
      } catch (err) {
        // 防御：初始化/扫描失败不影响页面其他部分
        console.error("[MermaidRenderer]", err);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
