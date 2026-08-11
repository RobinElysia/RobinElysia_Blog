/**
 * 数据库迁移脚本（容器启动时执行）
 * 用 drizzle-orm 的 migrator（production API，无需 drizzle-kit）
 * 运行：node scripts/migrate.mjs
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/blog";

const pool = new Pool({ connectionString });

try {
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ 数据库迁移完成");
} catch (err) {
  console.error("✗ 数据库迁移失败:", err);
  process.exit(1);
} finally {
  await pool.end();
}
