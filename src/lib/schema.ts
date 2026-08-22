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
 * 设计决策（详见 .claude/architecture/adr/0005-database-and-orm.md）：
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
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    tags: text("tags").array().notNull().default([]),
    coverImage: text("cover_image"),
    /** 封面署名行（v0.22.0：编辑器绑定档案图时由服务端生成，PostCard/CardInfo 展示） */
    coverCredit: text("cover_credit"),
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
    /** status 枚举兼容保留（v0.7.0 起无审核流，代码只写 approved；历史 pending 数据仍可读） */
    status: text("status", { enum: ["pending", "approved", "spam"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_post_id_idx").on(t.postId), index("comments_status_idx").on(t.status)],
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

export const images = pgTable(
  "images",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** 图片二进制 */
    data: byteaColumn("data").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    /**
     * 用途（v0.22.0）：
     * - inline：编辑器粘贴/拖拽上传的正文配图（历史数据默认）
     * - cover：档案图封面候选/绑定图（由 /api/archive-candidates 写入）
     * 孤儿清扫只作用于 cover（inline 图在正文 markdown 中引用，无法安全判定未引用）
     */
    kind: text("kind", { enum: ["inline", "cover"] })
      .notNull()
      .default("inline"),
    /** 来源馆藏 work id（Wellcome work ID，去重用：同一 work 不再重复推荐） */
    sourceId: text("source_id"),
    /**
     * 档案图元数据（kind='cover' 时有值；保存文章时服务端据此重建署名行，
     * 不信任客户端提交的 credit 文本）
     */
    title: text("title"),
    creator: text("creator"),
    date: text("date"),
    source: text("source"),
    sourceUrl: text("source_url"),
    license: text("license"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("images_kind_idx").on(t.kind), index("images_source_id_idx").on(t.sourceId)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Image = typeof images.$inferSelect;
