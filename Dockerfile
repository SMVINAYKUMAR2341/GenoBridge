# Multi-stage Production Dockerfile for Next.js 16 + Payload CMS
FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends curl openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install pnpm directly via npm (avoids corepack /nonexistent home permission errors)
RUN npm install -g pnpm@10.6.1

ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_HOME=/tmp/corepack

# Step 1: Dependencies
FROM base AS deps
WORKDIR /app

# Handle build context whether root or subfolder
COPY package.json* pnpm-lock.yaml* ./
COPY ClinicalGeneticsReferralDecisionSupport-main/package.json* ClinicalGeneticsReferralDecisionSupport-main/pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

# Step 2: Build Next.js application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./
# If build context is root, overlay subfolder contents to /app
RUN if [ -d "ClinicalGeneticsReferralDecisionSupport-main" ]; then cp -rf ClinicalGeneticsReferralDecisionSupport-main/. ./ ; fi

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME=/app

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs -d /app nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts* ./
COPY --from=builder --chown=nextjs:nodejs /app/figma-image-loader.ts* ./

USER nextjs

EXPOSE 3000

CMD ["pnpm", "run", "start"]
