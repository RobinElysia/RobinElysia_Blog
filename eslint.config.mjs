import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPlugin from "eslint-plugin-react";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 显式声明 react 插件（规则 react/jsx-no-leaked-render 依赖它；
  // eslint-plugin-react 是 eslint-config-next 的传递依赖，pnpm 严格模式下
  // 不提升到根 node_modules，必须作为直接依赖声明 + 显式注册，否则解析失败）
  { plugins: { react: reactPlugin } },
  // 项目自有规则（与 .claude/conventions/code-style/eslint-notes.md 对齐，2026-08-20 落地）
  {
    rules: {
      // 生产代码不允许 console.log；console.warn/console.error 允许（错误日志场景）
      "no-console": ["error", { allow: ["warn", "error"] }],
      // 未使用变量/参数（下划线前缀视为有意忽略，如 _prev）
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 任何 any 都需要显式豁免并附注释（eslint-disable + reason）
      "@typescript-eslint/no-explicit-any": "error",
      // 提醒补充返回值类型（不阻止提交）
      "@typescript-eslint/explicit-function-return-type": "warn",
      // 防止 {items.length && <List />} 渲染 0
      "react/jsx-no-leaked-render": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 编排与回显临时目录（不入库）
    ".dsm/**",
    "_md_output/**",
  ]),
]);

export default eslintConfig;
