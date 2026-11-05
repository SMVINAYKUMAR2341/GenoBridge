# Multi-stage Production Dockerfile for Next.js 16 + Payload CMS
FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends curl openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.6.1 --activate

# Step 1: Dependencies
FROM base AS deps
WORKDIR /app

# Handle build context whether root or subfolder
COPY package.json* pnpm-lock.yaml* ./
COPY ClinicalGeneticsReferralDecisionSupport-main/package.json* ClinicalGeneticsReferralDecisionSupport-main/pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile --ignore-engines

# Step 2: Build Next.js application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./
# If build context is root, overlay subfolder contents to /app
RUN if [ -d "ClinicalGeneticsReferralDecisionSupport-main" ]; then cp -rn ClinicalGeneticsReferralDecisionSupport-main/* ./ ; fi

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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["pnpm", "run", "start"]
