"use client";

import { useActionState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitComment } from "@/actions/comment";

/**
 * 评论表单 —— Client Component
 * useActionState 管理提交状态（见 server-actions-contract.md）
 * 注意：dispatch 返回 void，成功信号通过 state 传递（submitted 字段），
 * 不能在 form action 里 await dispatch 的返回值。
 */

type FormState = { ok: boolean; error?: string; submitted: boolean };

const initialState: FormState = { ok: true, submitted: false };

export function CommentForm({ postId }: { postId: number }) {
  const [result, action, isPending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const r = await submitComment(prev, fd);
      return r.ok
        ? { ok: true, submitted: true }
        : { ok: false, error: r.error, submitted: false };
    },
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-12 border-t border-line pt-8">
      <h2 className="text-xs font-medium tracking-[0.25em] text-muted uppercase">发表评论</h2>

      <AnimatePresence mode="wait">
        {result.submitted ? (
          <motion.p
            key="submitted"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-sm leading-6 text-muted"
          >
            评论已提交。
          </motion.p>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            action={action}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-4"
          >
          <input type="hidden" name="postId" value={postId} />
          <div>
            <label htmlFor="authorName" className="block text-xs text-muted">
              昵称
            </label>
            <input
              id="authorName"
              name="authorName"
              required
              maxLength={50}
              placeholder="你的名字"
              className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-xs text-muted">
              评论内容
            </label>
            <textarea
              id="content"
              name="content"
              required
              maxLength={1000}
              rows={4}
              placeholder="写点什么……"
              className="mt-1 w-full resize-y border-b border-line bg-transparent py-2 text-sm leading-6 outline-none focus:border-ink"
            />
          </div>
          {!result.ok && result.error && (
            <p className="text-xs text-muted">{result.error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="border border-ink px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            {isPending ? "提交中…" : "提交评论"}
          </button>
        </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
