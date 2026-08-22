import { describe, expect, it } from "vitest";
import { formatDate, slugify, readingTime } from "./format";

describe("formatDate", () => {
  it("格式化 Date 为中文日期", () => {
    expect(formatDate(new Date(2025, 6, 11))).toBe("2025年7月11日");
  });

  it("接受 ISO 字符串", () => {
    expect(formatDate("2025-07-11T00:00:00Z")).toBe("2025年7月11日");
  });

  it("null 返回空串", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("slugify", () => {
  it("英文转小写连字符", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("去除首尾连字符", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("保留中文字符", () => {
    expect(slugify("你好 ReZenKi")).toBe("你好-rezenki");
  });

  it("空串返回空串", () => {
    expect(slugify("")).toBe("");
  });
});

describe("readingTime", () => {
  it("中文按 400 字/分钟", () => {
    const cn = "字".repeat(800);
    expect(readingTime(cn)).toBe(2);
  });

  it("至少 1 分钟", () => {
    expect(readingTime("hi")).toBe(1);
  });

  it("混合中英文", () => {
    const mixed = "字".repeat(400) + "word".repeat(50);
    // 400 中文 = 1min，200 英文字符 = 1min → 2min
    expect(readingTime(mixed)).toBe(2);
  });
});
