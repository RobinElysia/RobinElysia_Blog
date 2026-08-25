import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注：Docker 镜像不用 output: standalone——Next 16 对 pnpm peer-suffix 目录
  // （drizzle-orm@…_@types+pg… 等）追踪失效（漏包）；且 standalone 与 next start
  // 互斥。runner 阶段用 pnpm install --prod 保证运行时依赖完整（见 Dockerfile）。
  // 图片优化：优先输出 AVIF/WebP（见 .claude/architecture/runtime-and-deployment.md）
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 注：Next.js 16 中 serverActions.bodySizeLimit 移入 experimental，且默认 1MB
  // 对纯文本评论已足够；如需调大（如上传图片评论），用
  // experimental: { serverActions: { bodySizeLimit: "5mb" } }

  // 音频静态缓存（v0.23.1）：mp3 文件内容不变，一年期 immutable——
  // 服务器带宽有限（VPS 实测 ~400KB/s），首次慢、此后浏览器不再回源
  // （Next 对 /public 文件默认 max-age=0，每次访问都重新下载）
  async headers() {
    return [
      {
        source: "/music/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
