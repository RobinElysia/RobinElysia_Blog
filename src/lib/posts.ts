import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
import { and, desc, eq, sql } from "drizzle-orm";

/**
 * 数据访问层 —— 所有数据库查询集中于此。
 *
 * 缓存策略（见 .claude/data-layer/caching-and-revalidation.md）：
 * - 数据库查询不走 fetch Data Cache，用 unstable_cache 函数级缓存
 * - tag 规范：统一 post-list（全站粒度），写入后 revalidateTag("post-list", "max")
 */

/** 已发布文章列表（首页 /blog），按发布时间倒序 */
export const getPublishedPosts = unstable_cache(
  async () => {
    return db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        tags: posts.tags,
        coverImage: posts.coverImage,
        coverCredit: posts.coverCredit,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt));
  },
  ["post-list"],
  { tags: ["post-list"], revalidate: 300 },
);

/** 单篇文章（含正文），不存在返回 null */
export async function getPostBySlug(slug: string) {
  // unstable_cache 的 keyParts 在模块加载时构建，无法包含运行时参数——
  // 正确模式：在函数内部调用 unstable_cache，把 slug 纳入缓存键
  return unstable_cache(
    async () => {
      const rows = await db
        .select()
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
        .limit(1);
      return rows[0] ?? null;
    },
    ["post", "by-slug", slug],
    { tags: ["post-list"], revalidate: 300 },
  )();
}

/** 按标签筛选已发布文章（/blog?tag=） */
export async function getPostsByTag(tag: string) {
  return unstable_cache(
    async () => {
      return db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          excerpt: posts.excerpt,
          tags: posts.tags,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(and(eq(posts.status, "published"), sql`${tag} = ANY(${posts.tags})`))
        .orderBy(desc(posts.publishedAt));
    },
    ["post-list", "by-tag", tag],
    { tags: ["post-list"], revalidate: 300 },
  )();
}

/** 按 tag 统计文章数（Dashboard 用，将来标签页用） */
export const countPostsByTag = async () => {
  return db
    .select({ tag: sql<string>`unnest(${posts.tags})`, count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, "published"))
    .groupBy(sql`unnest(${posts.tags})`)
    .orderBy(sql`count desc`);
};

/** 分页查询（/blog?page=N）：返回 { items, total, totalPages } */
export async function getPostsPage(page = 1, pageSize = 10) {
  return unstable_cache(
    async () => {
      const offset = (page - 1) * pageSize;
      const [items, countRows] = await Promise.all([
        db
          .select({
            id: posts.id,
            slug: posts.slug,
            title: posts.title,
            excerpt: posts.excerpt,
            tags: posts.tags,
            publishedAt: posts.publishedAt,
          })
          .from(posts)
          .where(eq(posts.status, "published"))
          .orderBy(desc(posts.publishedAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(eq(posts.status, "published")),
      ]);
      const total = Number(countRows[0]?.count ?? 0);
      return { items, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },
    ["post-list", "page", String(page), String(pageSize)],
    { tags: ["post-list"], revalidate: 300 },
  )();
}

/** 上一篇/下一篇（按发布时间相邻）
 *  注意：publishedAt 可能来自 unstable_cache 序列化（string），统一 new Date() 处理 */
export async function getAdjacentPosts(slug: string, publishedAt: Date | string | null) {
  if (!publishedAt) return { prev: null, next: null };
  const ts = new Date(publishedAt);
  return unstable_cache(
    async () => {
      const [prevRows, nextRows] = await Promise.all([
        db
          .select({ slug: posts.slug, title: posts.title })
          .from(posts)
          .where(and(eq(posts.status, "published"), sql`${posts.publishedAt} < ${ts}`))
          .orderBy(desc(posts.publishedAt))
          .limit(1),
        db
          .select({ slug: posts.slug, title: posts.title })
          .from(posts)
          .where(and(eq(posts.status, "published"), sql`${posts.publishedAt} > ${ts}`))
          .orderBy(posts.publishedAt)
          .limit(1),
      ]);
      return { prev: prevRows[0] ?? null, next: nextRows[0] ?? null };
    },
    ["post", "adjacent", slug],
    { tags: ["post-list"], revalidate: 300 },
  )();
}

/** 相关文章（同标签优先，最多 3 篇，排除当前文章） */
export async function getRelatedPosts(slug: string, tags: string[], limit = 3) {
  if (tags.length === 0) return [];
  return unstable_cache(
    async () => {
      return db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          excerpt: posts.excerpt,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.status, "published"),
            sql`${posts.tags} && ARRAY[${sql.join(
              tags.map((t) => sql`${t}`),
              sql`, `,
            )}]`,
            sql`${posts.slug} != ${slug}`,
          ),
        )
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
    },
    ["post", "related", slug, ...tags],
    { tags: ["post-list"], revalidate: 300 },
  )();
}

/** 首页精选（最近 N 篇） */
export const getRecentPosts = unstable_cache(
  async (limit = 3) => {
    return db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
  },
  ["post-list", "recent"],
  { tags: ["post-list"], revalidate: 300 },
);
