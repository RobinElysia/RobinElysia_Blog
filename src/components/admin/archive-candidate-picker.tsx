"use client";

import { useState } from "react";

/**
 * 档案图候选选择器（v0.22.0）
 * - "获取 3 张"：POST /api/archive-candidates（可选关键词；留空主题池随机）
 * - 服务端已把候选图下载入库（/api/images/{id}），此处仅展示与绑定
 * - 点击候选 → 填入 #coverImage 输入框（表单随文章保存），并高亮选中
 * - 换一批 → 重新请求；上一批未选中的图由服务端 24h 孤儿清扫回收
 */

type Candidate = {
  id: number;
  url: string;
  title: string;
  creator: string;
  date: string;
  source: string;
  sourceUrl: string;
  license: string;
};

export function ArchiveCandidatePicker() {
  const [keyword, setKeyword] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/archive-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keyword.trim() || undefined }),
      });
      const data = (await res.json().catch(() => null)) as {
        candidates?: Candidate[];
        error?: string;
      } | null;
      if (!res.ok || !data?.candidates) {
        setError(data?.error ?? "获取失败，请稍后重试");
        return;
      }
      setCandidates(data.candidates);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  /** 绑定：填入 coverImage 输入框 + 高亮 */
  const bind = (c: Candidate) => {
    const el = document.getElementById("coverImage") as HTMLInputElement | null;
    if (el) el.value = c.url;
    setSelected(c.url);
  };

  const credit = (c: Candidate) =>
    [c.creator, c.title ? `*${c.title}*` : "", c.date, c.license].filter(Boolean).join(", ");

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="archiveKeyword" className="text-xs text-muted">
          档案图候选（Wellcome 公共领域藏品，与站内已用图去重）
        </label>
        <button
          type="button"
          onClick={fetchCandidates}
          disabled={loading}
          className="border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
        >
          {loading ? "检索中…" : "获取 3 张"}
        </button>
      </div>
      <input
        id="archiveKeyword"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void fetchCandidates();
          }
        }}
        placeholder="关键词（可选；留空随机主题，如 astronomy / botany / alchemy）"
        maxLength={100}
        className="mt-2 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
      />
      {error && <p className="mt-2 text-xs text-muted">{error}</p>}

      {candidates.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => bind(c)}
              className={`group border p-1 text-left transition-colors ${
                selected === c.url ? "border-ink" : "border-line hover:border-ink"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 候选缩略图（本地 /api/images 动态服务，img 更简） */}
              <img
                src={c.url}
                alt={c.title}
                loading="lazy"
                className="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              />
              <p className="mt-1 truncate text-[10px] text-muted">{c.title}</p>
              <p className="truncate text-[10px] leading-4 text-muted">{credit(c)}</p>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <p className="mt-2 text-xs text-muted">
          已绑定封面：<span className="font-mono">{selected}</span>（随文章保存生效）
        </p>
      )}
    </div>
  );
}
