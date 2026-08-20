import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化：优先输出 AVIF/WebP（见 .claude/architecture/runtime-and-deployment.md）
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 注：Next.js 16 中 serverActions.bodySizeLimit 移入 experimental，且默认 1MB
  // 对纯文本评论已足够；如需调大（如上传图片评论），用
  // experimental: { serverActions: { bodySizeLimit: "5mb" } }
};

export default nextConfig;
