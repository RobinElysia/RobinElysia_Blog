import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";
/**
 * 数据库 Schema —— PostGre 存储架构
 *
 * 设计决策（详见 .harness/architecture/adr/0005-database-and-orm.md）：
 * 1. 正文存 Markdown 原文（text），渲染时由 next-mdx-remote 编译，
 *    不存 HTML —— 存储与渲染解耦，XSS 面最小
 * 2. metadata（title/excerpt/tags）独立列，不塞 JSON —— 列表查询不读 content 大字段
 * 3. tags 用 PostGre 原生 TEXT[] —— 博客标签低基数，免关联表 JOIN；
 *    出现"标签重命名/合并/统计"需求时再迁移关联表（tech-debt 触发条件）
 * 4. status 控制草稿/发布，published_at 与 status 解耦（为定时发布留空间）
 */

/** 文章表 */
export const posts = pgTable(
  "posts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    /** Markdown 原文，渲染时编译 */
    content: text("content").notNull(),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    tags: text("tags").array().notNull().default([]),
    coverImage: text("cover_image"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("posts_slug_idx").on(t.slug),
    index("posts_status_published_idx").on(t.status, t.publishedAt),
  ],
);

/** 评论表 —— 自建评论，取代 Giscus（见 ADR-0005） */
export const comments = pgTable(
  "comments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    content: text("content").notNull(),
    /** 审核流：待审 → 通过/垃圾 */
    status: text("status", { enum: ["pending", "approved", "spam"] }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("comments_post_id_idx").on(t.postId),
    index("comments_status_idx").on(t.status),
  ],
);

/**
 * 文章图片表（v0.18.0：PostGre BYTEA 存储方案）
 * - 编辑器粘贴/拖拽上传 → 存二进制 → 正文用 ![alt](/api/images/{id}) 引用
 * - 不存 Base64（体积膨胀）；图片量大时迁移 S3（加 storage 列平滑过渡）
 */

/** drizzle 0.45 无内置 bytea，用 customType（pg 驱动返回 Buffer） */
const byteaColumn = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const images = pgTable("images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** 图片二进制 */
  data: byteaColumn("data").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Image = typeof images.$inferSelect;
