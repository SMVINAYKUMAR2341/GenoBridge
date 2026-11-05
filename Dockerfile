# Helix Production Multi-Stage Dockerfile
FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends curl openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# Step 1: Dependencies
FROM base AS deps
WORKDIR /app

COPY ClinicalGeneticsReferralDecisionSupport-main/package.json ClinicalGeneticsReferralDecisionSupport-main/pnpm-lock.yaml* ./
COPY ClinicalGeneticsReferralDecisionSupport-main/.npmrc* ./

RUN pnpm install --no-frozen-lockfile

# Step 2: Build
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY ClinicalGeneticsReferralDecisionSupport-main/ ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build

# Step 3: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["pnpm", "run", "start"]
