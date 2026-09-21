# Stage 1: build with bun
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST
RUN bun run build

# Stage 2: minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 GIT_SHA=$GIT_SHA BUILD_TIME=$BUILD_TIME
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
