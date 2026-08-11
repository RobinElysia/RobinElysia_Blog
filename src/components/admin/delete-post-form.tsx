"use client";

/**
 * 删除文章表单 —— client 组件（confirm 确认需要事件处理器，
 * Server Component 不能传 onSubmit 给客户端表单）
 * Server Action 引用可跨 Server/Client 边界传递
 */
export function DeletePostForm({
  postId,
  onDelete,
}: {
  postId: number;
  onDelete: (id: number) => Promise<unknown>;
}) {
  return (
    <form
      action={async () => {
        if (confirm("确定删除这篇文章？评论将一并删除。")) {
          await onDelete(postId);
        }
      }}
    >
      <button type="submit" className="text-muted hover:text-ink">
        删除
      </button>
    </form>
  );
}
