"use client";

import { useActionState, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { createPost, updatePost } from "@/actions/admin";
import { slugify } from "@/lib/format";
import { previewRemarkPlugins, previewRehypePlugins } from "@/lib/mdx-options";
import { MermaidRenderer } from "@/components/mermaid";
import { PRESET_GALLERY } from "@/lib/archive-images";
import { ArchiveCandidatePicker } from "@/components/admin/archive-candidate-picker";
import type { Post } from "@/lib/schema";

/**
 * 文章编辑表单 —— 新建/编辑共用
 * - 工具条：插入 Markdown 语法（标题/粗体/链接/图片/代码/LaTeX/Mermaid/引用/表格）
 * - 编辑 / 预览 Tab：预览复用详情页同一渲染管线（所见即所得）
 * - slug 从标题自动生成（可手动覆盖）
 */

type FormState = { ok: boolean; error?: string };

type PostFormProps = { mode: "create"; post?: never } | { mode: "edit"; post: Post };

/** 工具条按钮：wrap=true 时包裹选区，否则在光标处插入 */
const TOOLBAR: { label: string; insert: string; wrap?: boolean; title?: string }[] = [
  { label: "H2", insert: "## ", title: "二级标题" },
  { label: "H3", insert: "### ", title: "三级标题" },
  { label: "B", insert: "**", wrap: true, title: "粗体" },
  { label: "I", insert: "*", wrap: true, title: "斜体" },
  { label: "链接", insert: "[文字](https://)", title: "插入链接" },
  { label: "图片", insert: "![图片描述](https://)", title: "插入图片（粘贴 URL）" },
  { label: "代码", insert: "```\n", wrap: true, title: "代码块" },
  { label: "公式", insert: "$", wrap: true, title: "行内公式（$x^2$）" },
  {
    label: "公式块",
    insert: "```latex\n\\int_0^1 x^2 dx\n```",
    title: "块级公式（```latex 代码块）",
  },
  {
    label: "Mermaid",
    insert: "```mermaid\nflowchart TD\n  A[开始] --> B[结束]\n```",
    title: "Mermaid 图表",
  },
  { label: "引用", insert: "> ", title: "引用块" },
  { label: "表格", insert: "| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |", title: "表格" },
];

export function PostForm({ mode, post }: PostFormProps) {
  const action = mode === "create" ? createPost : (fd: FormData) => updatePost(post.id, fd);
  const [result, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await action(fd)) as FormState,
    { ok: true },
  );

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [content, setContent] = useState(post?.content ?? "");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** 工具条插入：wrap 包裹选区 / 否则光标处插入 */
  const insertSyntax = (item: (typeof TOOLBAR)[number]) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end);

    let next: string;
    let caret: number;
    if (item.wrap) {
      next = value.slice(0, start) + item.insert + selected + item.insert + value.slice(end);
      caret = start + item.insert.length + selected.length + item.insert.length;
    } else {
      next = value.slice(0, start) + item.insert + value.slice(end);
      caret = start + item.insert.length;
    }
    setContent(next);
    // 下一帧恢复焦点与光标
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  /** 上传图片（v0.18.0：PostGre BYTEA 方案），返回 /api/images/{id} URL */
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      alert("仅支持 jpeg / png / webp / gif 图片");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片超过 5MB 限制");
      return null;
    }
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: fd });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error ?? "上传失败");
      return null;
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  };

  /** 光标处插入图片 Markdown */
  const insertImageMarkdown = (url: string, alt = "图片") => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const syntax = `![${alt}](${url})`;
    const next = value.slice(0, selectionStart) + syntax + value.slice(selectionEnd);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = selectionStart + syntax.length;
      el.setSelectionRange(caret, caret);
    });
  };

  /** 粘贴图片（剪贴板） */
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (!imageItem) return; // 非图片粘贴走默认行为
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) insertImageMarkdown(url);
    } finally {
      setUploading(false);
    }
  };

  /** 拖拽图片到编辑区 */
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) insertImageMarkdown(url);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
  };

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-xs text-muted">
          标题
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={post?.title ?? ""}
          onChange={(e) => {
            // 新建时自动生成 slug（slug 输入框尚未手动编辑过才覆盖）
            const slugEl = document.getElementById("slug") as HTMLInputElement | null;
            if (slugEl && !slugEl.dataset.touched) slugEl.value = slugify(e.target.value);
          }}
          className="mt-1 w-full border-b border-line bg-transparent py-2 text-lg outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-xs text-muted">
          Slug（URL 标识）
        </label>
        <input
          id="slug"
          name="slug"
          required
          maxLength={200}
          defaultValue={post?.slug ?? ""}
          onChange={(e) => (e.target.dataset.touched = "true")}
          className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-xs text-muted">
          摘要
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          required
          maxLength={500}
          rows={2}
          defaultValue={post?.excerpt ?? ""}
          className="mt-1 w-full resize-y border-b border-line bg-transparent py-2 text-sm leading-6 outline-none focus:border-ink"
        />
      </div>

      {/* 封面图片（v0.21.4）：首页「最近」卡片配图；空 = 按 slug 回退档案图映射 */}
      <div>
        <label htmlFor="coverImage" className="block text-xs text-muted">
          封面图片（首页「最近」卡片；可选——留空自动回退档案图）
        </label>
        <input
          id="coverImage"
          name="coverImage"
          maxLength={500}
          defaultValue={post?.coverImage ?? ""}
          placeholder="/archive/xxx.jpg 或 https://…"
          className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
        />
        {/* 预设档案图快捷选择（点击填入上方输入框） */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_GALLERY.map((img) => (
            <button
              key={img.src}
              type="button"
              title={img.label}
              onClick={() => {
                const el = document.getElementById("coverImage") as HTMLInputElement | null;
                if (el) el.value = img.src;
              }}
              className="group border border-line p-1 transition-colors hover:border-ink"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 预设图缩略图（next/image 需尺寸配置，静态小图用 img 更简） */}
              <img
                src={img.src}
                alt={img.label}
                loading="lazy"
                className="h-12 w-16 object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
            </button>
          ))}
        </div>

        <ArchiveCandidatePicker />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="content" className="block text-xs text-muted">
            正文（Markdown · MDX 组件 · LaTeX · Mermaid）
          </label>
          {/* 编辑 / 预览 Tab */}
          <div className="flex gap-1 text-xs">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border px-3 py-1 transition-colors ${
                  tab === t
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {t === "edit" ? "编辑" : "预览"}
              </button>
            ))}
          </div>
        </div>

        {tab === "edit" ? (
          <>
            {/* 工具条 */}
            <div className="mt-2 flex flex-wrap gap-1 border border-b-0 border-line p-2">
              {TOOLBAR.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={item.title}
                  onClick={() => insertSyntax(item)}
                  className="border border-transparent px-2 py-1 text-xs text-muted transition-colors hover:border-line hover:text-ink"
                >
                  {item.label}
                </button>
              ))}
            </div>{" "}
            <textarea
              id="content"
              name="content"
              ref={textareaRef}
              required
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={
                "# 标题\n\n支持 Markdown、LaTeX（$x^2$）、Mermaid（```mermaid 代码块）、MDX 组件（<Callout>）\n\n可粘贴或拖拽图片到此处自动上传"
              }
              className="w-full resize-y border border-line bg-transparent p-3 font-mono text-sm leading-6 outline-none focus:border-ink"
            />
            {uploading && <p className="mt-1 text-xs text-muted">图片上传中…</p>}
          </>
        ) : (
          <div className="prose prose-neutral mt-2 max-w-none border border-line p-6 dark:prose-invert">
            {content.trim() === "" ? (
              <p className="text-sm text-muted">正文为空</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={previewRemarkPlugins}
                rehypePlugins={previewRehypePlugins}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        )}
        <MermaidRenderer />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="tags" className="block text-xs text-muted">
            标签（逗号分隔）
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={post?.tags.join(", ") ?? ""}
            placeholder="design, meta, 前端"
            className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs text-muted">
            状态
          </label>
          <select
            id="status"
            name="status"
            defaultValue={post?.status ?? "draft"}
            className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
          >
            <option value="draft">草稿</option>
            <option value="published">发布</option>
          </select>
        </div>
      </div>

      {!result.ok && result.error && <p className="text-xs text-muted">{result.error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="border border-ink bg-ink px-6 py-2 text-xs tracking-[0.2em] text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {isPending ? "保存中…" : mode === "create" ? "创建" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="border border-line px-6 py-2 text-xs tracking-[0.2em] text-muted uppercase transition-colors hover:border-ink hover:text-ink"
        >
          取消
        </button>
      </div>
    </form>
  );
}
