import { describe, expect, it } from "vitest";
import { escapeXml, toRfc822, generateRssFeed } from "./feed";

describe("escapeXml", () => {
  it("转义 XML 特殊字符", () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;",
    );
  });

  it("普通文本保持不变", () => {
    expect(escapeXml("你好，ReZenKi")).toBe("你好，ReZenKi");
  });
});

describe("toRfc822", () => {
  it("输出 UTC 格式", () => {
    expect(toRfc822(new Date("2025-07-11T00:00:00Z"))).toBe(
      "Fri, 11 Jul 2025 00:00:00 GMT",
    );
  });

  it("null 返回 epoch", () => {
    expect(toRfc822(null)).toBe("Thu, 01 Jan 1970 00:00:00 GMT");
  });

  it("接受 ISO 字符串", () => {
    expect(toRfc822("2025-07-11T00:00:00Z")).toBe("Fri, 11 Jul 2025 00:00:00 GMT");
  });
});

describe("generateRssFeed", () => {
  const items = [
    {
      slug: "hello",
      title: "你好 & 再见",
      excerpt: "一篇文章",
      publishedAt: new Date("2025-07-11T00:00:00Z"),
    },
  ];

  it("生成合法 RSS 2.0 结构", () => {
    const xml = generateRssFeed(items, "https://example.com", "ReZenKi", "desc");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("<title>ReZenKi</title>");
    expect(xml).toContain("</channel>");
    expect(xml).toContain("</rss>");
  });

  it("标题特殊字符被转义", () => {
    const xml = generateRssFeed(items, "https://example.com", "ReZenKi", "desc");
    expect(xml).toContain("<title>你好 &amp; 再见</title>");
    expect(xml).not.toContain("<title>你好 & 再见</title>");
  });

  it("文章链接包含 slug", () => {
    const xml = generateRssFeed(items, "https://example.com", "ReZenKi", "desc");
    expect(xml).toContain("<link>https://example.com/blog/hello</link>");
  });

  it("空列表生成空 channel", () => {
    const xml = generateRssFeed([], "https://example.com", "ReZenKi", "desc");
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
