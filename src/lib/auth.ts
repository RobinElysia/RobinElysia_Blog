import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { isGithubUserAllowed } from "@/lib/auth-allowlist";

/**
 * NextAuth v5 配置 —— 仅 Dashboard 需要鉴权（C 端无需）
 * - GitHub OAuth（生产，需 .env.local 配置 AUTH_GITHUB_ID/AUTH_GITHUB_SECRET，
 *   未配置时不注册 provider——避免点击登录跳转报错，v0.19.5）
 * - Credentials（本地开发：.env.local 的 ADMIN_USERNAME/ADMIN_PASSWORD）
 * 规范见 .claude/architecture/app-router-map.md「鉴权边界」
 */
const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // 自定义 profile 映射：name 用 GitHub 用户名（login）而非显示名（profile.name）——
    // 白名单按用户名匹配（v0.19.13），否则显示名≠用户名时会被白名单拒绝
    ...(githubEnabled
      ? [
          GitHub({
            profile(profile) {
              return {
                id: String(profile.id),
                name: profile.login ?? profile.name ?? "",
                email: profile.email,
                image: profile.avatar_url,
              };
            },
          }),
        ]
      : []),
    Credentials({
      name: "管理员",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (
          username &&
          password &&
          username === process.env.ADMIN_USERNAME &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "RobinElysia" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // 安全（v0.19.10）：GitHub 登录必须命中白名单（AUTH_GITHUB_ALLOWED_USERS），
    // 否则任何 GitHub 用户都能进 Dashboard。Credentials 不受限（账号密码本身即凭证）
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        return isGithubUserAllowed(user.name, user.email);
      }
      return true;
    },
  },
});
