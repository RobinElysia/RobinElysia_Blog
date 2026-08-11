import { describe, expect, it } from "vitest";
import { extractHeadings } from "./toc";

describe("extractHeadings", () => {
  it("提取 h2/h3 标题", () => {
    const md = `# 大标题（忽略）

## 第一节

正文

### 子节

## 第二节`;
    const toc = extractHeadings(md);
    expect(toc).toEqual([
      { id: "第一节", text: "第一节", level: 2 },
      { id: "子节", text: "子节", level: 3 },
      { id: "第二节", text: "第二节", level: 2 },
    ]);
  });

  it("忽略 h1（大标题）和普通行", () => {
    const toc = extractHeadings("# 标题\n正文行\n## 小节");
    expect(toc).toHaveLength(1);
    expect(toc[0].level).toBe(2);
  });

  it("id 生成：去标点、空格转连字符", () => {
    const toc = extractHeadings("## Hello, World! 你好");
    expect(toc[0].id).toBe("hello-world-你好");
  });

  it("去除行内格式符号", () => {
    const toc = extractHeadings("## **加粗** 和 \`code\`");
    expect(toc[0].text).toBe("加粗 和 code");
  });

  it("空内容返回空数组", () => {
    expect(extractHeadings("")).toEqual([]);
  });
});
