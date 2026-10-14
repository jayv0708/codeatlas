# CodeAtlas — Production Dockerfile
# Multi-stage build for small, secure production images.

# ── Stage 1: Dependencies ──────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: Build ─────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Enable standalone output for Docker builds
ENV NEXT_PRIVATE_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ── Stage 3: Production ────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 codeatlas

# Copy production artifacts
COPY --from=builder --chown=codeatlas:nodejs /app/.next/standalone ./
COPY --from=builder --chown=codeatlas:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=codeatlas:nodejs /app/public ./public
COPY --from=builder --chown=codeatlas:nodejs /app/prisma ./prisma

USER codeatlas

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
