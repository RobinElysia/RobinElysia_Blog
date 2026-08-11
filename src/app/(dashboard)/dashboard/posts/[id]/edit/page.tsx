import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PostForm } from "@/components/admin/post-form";

/** 编辑文章 */
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold">编辑文章</h1>
      <PostForm mode="edit" post={post} />
    </div>
  );
}
