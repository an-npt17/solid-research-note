FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# ── Development ────────────────────────────────────────────────────────────────
FROM base AS development
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Production ─────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
RUN bun run build
EXPOSE 4173
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0"]
