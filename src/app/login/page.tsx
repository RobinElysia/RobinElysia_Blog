import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

/**
 * 登录页 —— Dashboard 专用（C 端无需）
 * GitHub OAuth（生产，凭证存在时显示按钮）+ Credentials（本地开发）
 * v0.19.8：GitHub 按钮由服务端判断凭证是否配置（运行时生效，Docker 换凭证无需重建镜像）
 */
export default function LoginPage() {
  const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

  return (
    <Suspense>
      <LoginForm githubEnabled={githubEnabled} />
    </Suspense>
  );
}
