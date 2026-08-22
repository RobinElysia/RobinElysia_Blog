# ============================================
# ReZenKi Blog — 多阶段 Docker 构建
# 阶段 1：依赖（pnpm 全量 install——构建中唯一一次网络下载）
# 阶段 2：构建（next build → pnpm prune --prod 裁剪 devDeps）
# 阶段 3：运行（复制裁剪后的 node_modules + 产物——零网络）
#
# 网络韧性（慢网络 VPS 实测）：
# - registry 默认 npmmirror，可用 build arg NPM_REGISTRY 覆盖（海外服务器可换 registry.npmjs.org）
# - 超时/重试直接以 CLI 参数强制：fetch-timeout 10 分钟 + 重试 5 次 + network-concurrency 4
#   （.npmrc 的 fetch-timeout 在 pnpm 11 慢网络下不总是生效——实测 60s 默认仍触发，
#    CLI 参数优先级最高，杜绝大包如 next/mermaid/katex 单请求超时）
# - install 失败自动重试至多 3 次：pnpm store 在同一 RUN 层内保留，
#   重试只补下载缺失的大 tarball（首次 810/832 后中断的场景重试即成功）
# - --trust-lockfile 跳过 supply-chain 逐条校验（lockfile 受 git 信任，
#   否则 935 entries 逐个请求元数据，单次构建 6 分钟+ 且易超时）
# - runner 不再二次 install：prune --prod 是纯本地操作，
#   彻底消灭「服务器下载慢导致 runner 阶段超时」一类问题
# ============================================

# ---------- 阶段 1：依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm 11（corepack 在 node 22 可用）
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

# 镜像源可配（compose 传 PROD_NPM_REGISTRY；默认 npmmirror 国内快）
ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN echo "fetch-retry-maxtimeout=120000" > .npmrc
# --frozen-lockfile 保证可复现；onlyBuiltDependencies（esbuild/sharp）由 pnpm-workspace.yaml 生效
# 重试循环：慢网络下大包下载中断时，store 保留已下载内容，仅补缺失部分
RUN set -e; \
    attempt=1; \
    while [ $attempt -le 3 ]; do \
      if pnpm install --frozen-lockfile --trust-lockfile \
        --fetch-timeout=600000 --fetch-retries=5 --network-concurrency=4 \
        --registry=$NPM_REGISTRY; then \
        exit 0; \
      fi; \
      echo "[deps] install attempt $attempt failed, retrying in 20s (store keeps downloaded tarballs)"; \
      sleep 20; \
      attempt=$((attempt+1)); \
    done; \
    echo "[deps] pnpm install failed after 3 attempts"; \
    exit 1

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

# 裁剪 devDeps（纯本地操作，零网络）——runner 直接复制此 node_modules
RUN pnpm prune --prod

# ---------- 阶段 3：运行 ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 生产依赖（builder 阶段 prune --prod 后的产物，零网络复制）
# 注：不用 standalone 的 node_modules——Next 16 对 pnpm peer-suffix 目录
# （drizzle-orm@0.45.2_@types+pg... 等）追踪失效，运行时缺包；
# 完整 prod 依赖保证 migrate 与 SSR 的 drizzle-orm/next-mdx-remote 链齐全
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# 构建产物
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
