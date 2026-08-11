# ============================================
# ReZenKi Blog — 多阶段 Docker 构建
# 阶段 1：依赖（pnpm 全量，含构建脚本批准）
# 阶段 2：构建（next build）
# 阶段 3：运行（仅 production 依赖 + 产物）
# ============================================

# ---------- 阶段 1：依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm 11（corepack 在 node 22 可用）
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile 保证可复现；onlyBuiltDependencies（esbuild/sharp）由 pnpm-workspace.yaml 生效
RUN pnpm install --frozen-lockfile

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

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# 构建产物 + production 依赖
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
# 数据库迁移 SQL（容器启动时执行 migrate.mjs）
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

# 启动：先执行数据库迁移，再启动 Next.js（runner 无 pnpm，直接调 next 二进制）
CMD ["sh", "-c", "node scripts/migrate.mjs && node node_modules/next/dist/bin/next start"]
