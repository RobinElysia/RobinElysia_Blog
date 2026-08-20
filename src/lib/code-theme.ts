import type { ThemeInput } from "shiki";

/**
 * RobinElysia 代码高亮主题 —— 黑白灰层次（全站禁彩色）
 * 颜色用 CSS 变量引用 token，自动跟随 .dark class（shiki 4 已移除内置 css-variables 主题）
 * 灰阶层次：关键字最黑 → 函数/常量 → 字符串 → 注释最浅
 */
export const robinElysiaCodeTheme: ThemeInput = {
  name: "robinelysia",
  type: "light",
  bg: "var(--color-code)",
  fg: "var(--color-ink)",
  colors: {
    "editor.background": "var(--color-code)",
    "editor.foreground": "var(--color-ink)",
  },
  tokenColors: [
    // 注释：最浅灰
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "var(--color-muted)" },
    },
    // 关键字/类型：最深黑
    {
      scope: ["keyword", "storage.type", "storage.modifier", "storage"],
      settings: { foreground: "var(--color-ink)" },
    },
    // 函数：次深
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "var(--color-ink)" },
    },
    // 字符串：中灰（暖灰，chroma ≤0.015）
    {
      scope: ["string", "string.quoted", "punctuation.definition.string"],
      settings: { foreground: "oklch(0.42 0.014 60)" },
    },
    // 数字/常量：中灰
    {
      scope: ["constant.numeric", "constant.language", "constant"],
      settings: { foreground: "oklch(0.46 0.014 60)" },
    },
    // 类型名
    { scope: ["entity.name.type", "support.type"], settings: { foreground: "var(--color-ink)" } },
    // 变量/属性：默认文字色
    {
      scope: ["variable", "variable.other", "entity.name.variable"],
      settings: { foreground: "var(--color-ink)" },
    },
  ],
};
