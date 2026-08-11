"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

/**
 * 登录表单（client）—— GitHub 按钮显示与否由服务端传入（v0.19.8）
 * 为什么：NEXT_PUBLIC_ 变量在构建时内联，Docker 部署时无法随运行时 .env 变化；
 * 改为服务端判断凭证是否存在后传 prop，运行时生效。
 */
export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { username, password, redirect: false });
    if (res?.error) {
      setError("用户名或密码错误");
      return;
    }
    window.location.href = callbackUrl;
  };

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-24 md:py-32">
      <h1 className="text-center font-script text-5xl">ReZenKi</h1>
      <p className="mt-2 text-center text-xs tracking-[0.35em] text-muted uppercase">
        后台登录
      </p>

      <div className="mt-10 space-y-4">
        {githubEnabled && (
          <>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
              className="w-full border border-ink bg-ink py-3 text-xs tracking-[0.2em] text-paper uppercase transition-opacity hover:opacity-80"
            >
              使用 GitHub 登录
            </button>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              或
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={submitCredentials} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs text-muted">
              用户名
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-muted">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm outline-none focus:border-ink"
            />
          </div>
          {error && <p className="text-xs text-muted">{error}</p>}
          <button
            type="submit"
            className="w-full border border-ink py-3 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
          >
            登录
          </button>
        </form>
      </div>
    </main>
  );
}
