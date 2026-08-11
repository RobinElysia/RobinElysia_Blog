import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit 默认只加载 .env，需显式加载 .env.local（Next.js 约定）
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/blog",
  },
});
