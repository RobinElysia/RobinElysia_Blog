import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 配置 —— 核心流程见 e2e/blog.spec.ts
 * 需要：本地 PostGre 运行 + pnpm build（webServer 会自动执行）
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3011",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm start -p 3011",
    port: 3011,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
