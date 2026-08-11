/**
 * GitHub 登录白名单（v0.19.10）
 * 安全要求：Dashboard 只允许 .env 配置的用户登录，其他 GitHub 用户一律拒绝。
 * 规则：
 * - AUTH_GITHUB_ALLOWED_USERS 逗号分隔（GitHub 用户名或邮箱，大小写不敏感）
 * - 列表为空 → 拒绝所有 GitHub 登录（安全默认：未配置视为不允许任何人）
 */
export function isGithubUserAllowed(
  name: string | null | undefined,
  email: string | null | undefined,
): boolean {
  const allowed = (process.env.AUTH_GITHUB_ALLOWED_USERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return false;

  const nameOk = name != null && allowed.includes(name.toLowerCase());
  const emailOk = email != null && allowed.includes(email.toLowerCase());
  return nameOk || emailOk;
}
