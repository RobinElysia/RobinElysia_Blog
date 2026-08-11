import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// 独立脚本（seed 等）不经过 Next.js 的 env 加载，需显式读取 .env.local。
// Next.js 运行时已注入环境变量，dotenv 不覆盖已有值，无副作用。
config({ path: ".env.local" });

/**
 * PostGre 连接池 —— 全应用共享单例。
 * 惰性连接：drizzle 初始化不建立连接，首次查询才连接。
 * 因此 build 时（无 DATABASE_URL）不会失败，运行时需要配置。
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/blog",
});

export const db = drizzle(pool, { schema });
