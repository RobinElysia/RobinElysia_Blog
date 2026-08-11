import { PostForm } from "@/components/admin/post-form";

/** 新建文章 */
export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold">新建文章</h1>
      <PostForm mode="create" />
    </div>
  );
}
