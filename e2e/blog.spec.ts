import { test, expect } from "@playwright/test";

/**
 * 博客核心流程 E2E（6 条，见 .claude/testing/e2e-testing.md）
 * 前置：pnpm seed（数据）、pnpm build（webServer 自动）
 */

test.describe("博客核心流程", () => {
  test("首页场景化（波浪 Hero + 逐卡翻页）", async ({ page }) => {
    await page.goto("/");
    // Scene 1：花体 Hero + 3D 波浪（canvas 为 three 动态挂载，放宽等待）
    await expect(page.getByRole("heading", { name: "ReZenKi", exact: true })).toBeVisible();
    await expect(page.locator("header canvas").first()).toBeVisible({ timeout: 15_000 });
    // 滚动容器（scroll-snap）
    const scroller = page.locator("[data-scroll-container]");
    await expect(scroller).toBeVisible();
    // 滚到底：翻页卡片可见（含图片）
    await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(page.getByRole("link", { name: /你好，ReZenKi/ }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("点击文章进入详情，正文与 TOC 渲染", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: /你好，ReZenKi/ }).click();
    await expect(page).toHaveURL(/\/blog\/hello-rezenki/);
    // 页面标题（MDX 正文 h1 与页面 h1 同名，取页面 header 内的）
    await expect(page.locator("article header h1")).toBeVisible();
    // MDX 正文渲染（h2 标题来自 Markdown）
    await expect(page.locator(".prose").getByText("名字的含义")).toBeVisible();
  });

  test("不存在的文章返回 404", async ({ page }) => {
    const res = await page.goto("/blog/this-post-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("这篇文章不存在或尚未发布")).toBeVisible();
  });

  test("提交评论显示成功提示", async ({ page }) => {
    await page.goto("/blog/hello-rezenki");
    await page.getByLabel("昵称").fill("E2E 测试");
    await page.getByLabel("评论内容").fill("端到端测试评论。");
    await page.getByRole("button", { name: "提交评论" }).click();
    await expect(page.getByText("评论已提交")).toBeVisible();
  });

  test("LaTeX 与 Mermaid 渲染", async ({ page }) => {
    await page.goto("/blog/latex-and-mermaid");
    // 行内公式（KaTeX）
    await expect(page.locator(".katex").first()).toBeVisible();
    // 块级公式（latex 代码块 → katex-display；FadeIn 需滚动触发）
    const blockFormula = page.locator(".katex-display").first();
    await blockFormula.scrollIntoViewIfNeeded();
    await expect(blockFormula).toBeVisible();
    // Mermaid 图表渲染为 SVG（客户端渲染，等待出现；svg 在 pre 内，避免撞上 slug 的 mermaid-* id）
    const mermaidSvg = page.locator("pre svg").first();
    await mermaidSvg.scrollIntoViewIfNeeded();
    await expect(mermaidSvg).toBeVisible({ timeout: 15_000 });
  });

  test("未登录访问 Dashboard 重定向到登录页", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
