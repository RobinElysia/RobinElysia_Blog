# ============================================
# RobinElysia Blog — 多阶段 Docker 构建
# 阶段 1：依赖（pnpm 全量，含构建脚本批准）
# 阶段 2：构建（next build）
# 阶段 3：运行（仅生产依赖 + 产物）
#
# npm 源固定 npmmirror（国内/海外均可访问，构建稳定）+ 大网络超时；
# --trust-lockfile 跳过 supply-chain 逐条校验（lockfile 受 git 信任，
# 否则 935 entries 逐个请求元数据，单次构建 6 分钟+）
# ============================================

# ---------- 阶段 1：依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm 11（corepack 在 node 22 可用）
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# fetch 超时放大到 10 分钟（npm 的 --network-timeout 等价物；pnpm 默认 60s，
# 慢网络下大包下载会 abort）
RUN echo "fetch-timeout=600000" > .npmrc
# --frozen-lockfile 保证可复现；onlyBuiltDependencies（esbuild/sharp）由 pnpm-workspace.yaml 生效
# --trust-lockfile 跳过 supply-chain 逐条校验（lockfile 受 git 信任，
# 否则 935 entries 逐个请求元数据，单次构建 6 分钟+ 且易超时）
RUN pnpm install --frozen-lockfile --trust-lockfile \
    --registry=https://registry.npmmirror.com

# ---------- 阶段 2：构建 ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# NextAuth v5 在 production 构建时需要 AUTH_SECRET（占位，运行时被真实值覆盖）
ENV AUTH_SECRET=build-placeholder-secret
# 构建期不连数据库（页面全部 force-dynamic，惰性连接）
RUN pnpm build

# ---------- 阶段 3：运行 ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# pnpm 生产依赖（仅 prod deps，无 devDeps——比旧方案全量 node_modules 小得多）
# 注：不用 standalone 的 node_modules——Next 16 对 pnpm peer-suffix 目录
# （drizzle-orm@0.45.2_@types+pg... 等）追踪失效，运行时缺包；
# 完整 prod 依赖保证 migrate 与 SSR 的 drizzle-orm/next-mdx-remote 链齐全
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN echo "fetch-timeout=600000" > .npmrc
RUN pnpm install --prod --frozen-lockfile --trust-lockfile \
    --registry=https://registry.npmmirror.com

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# 构建产物（完整 .next；runner 自装 prod 依赖，见上）
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
# 数据库迁移 SQL + 迁移脚本（容器启动时执行）
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs

USER nextjs

EXPOSE 3000

# 启动：先执行数据库迁移，再启动 Next.js（runner 无 pnpm，直接调 next 二进制）
CMD ["sh", "-c", "node scripts/migrate.mjs && node node_modules/next/dist/bin/next start"]
