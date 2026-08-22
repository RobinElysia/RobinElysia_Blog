import { test, expect } from "@playwright/test";

/**
 * 博客核心流程 E2E（6 条，见 .claude/testing/e2e-testing.md）
 * 前置：pnpm seed（数据）、pnpm build（webServer 自动）
 */

test.describe("博客核心流程", () => {
  test("首页章节叙事（视差舞台 Hero + 逐卡翻页 + 档案 + 章节导航）", async ({ page }) => {
    test.setTimeout(60_000);
    // 跳过 ReZenKi 手写 intro（非本测试目标；overlay 会挡点击 + 拖慢预算）
    await page.addInitScript(() => sessionStorage.setItem("intro-played", "1"));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Ch.00 序：衬线大标题 + 主图舞台（v0.21.3 删 3D 水波纹，无 canvas）+ 散落图集
    await expect(page.getByRole("heading", { name: "ReZenKi", exact: true })).toBeVisible();
    await expect(page.getByText("Scroll To Explore")).toBeVisible();
    await expect(page.locator("img[src*='hero-paradise']")).toBeVisible();
    await expect(page.locator("[data-hero-scatter]")).toHaveCount(6);
    // 滚动容器（scroll-snap）+ 章节导航（4 个章节按钮）
    const scroller = page.locator("[data-scroll-container]");
    await expect(scroller).toBeVisible();
    await expect(page.getByRole("navigation", { name: "章节导航" })).toBeVisible();
    await expect(page.locator("[data-chapter]")).toHaveCount(4);
    // 滚到底：Ch.03 落款可见（章节按钮可达：点击第 4 章跳转；
    // 限定章节区域——全局 contentinfo footer 也有同名文案，避免 strict 歧义）
    await page.getByRole("button", { name: "第 4 章：落款" }).click();
    await expect(
      page
        .getByRole("region", { name: "落款" })
        .getByText("© 2025 ReZenKi · ReZen And KiKi"),
    ).toBeVisible({ timeout: 10_000 });
    // 档案帖子原路返回（x 归位 48px + 淡出）+ 落款手写签名完成（滚动驱动/触发式动效不回归）
    await expect(page.locator("[data-archive-post]").first()).toHaveCSS("opacity", "0");
    await expect(page.locator("[data-colophon-sign] .colophon-fill")).toHaveCSS("opacity", "1", {
      timeout: 10_000,
    });
    // R4 回归：滚回第一张卡片页——卡片容器 opacity 必须被滚动驱动为 1
    // （toBeVisible 不检查 opacity；motion useSpring(number) 不追踪变化曾致恒 0）
    await scroller.evaluate((el) => el.scrollTo({ top: el.clientHeight, behavior: "instant" }));
    const card = page.locator("[data-card-slide]").first();
    await expect(card).toHaveCSS("opacity", "1");
    await expect(card.locator("img")).toBeVisible();
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
