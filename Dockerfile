# ---- Backend Build Stage ----
FROM node:24-alpine AS backend-build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
# Copy static files to dist directory since TypeScript build doesn't copy them
RUN mkdir -p dist/static && cp -r src/static/* dist/static/ 2>/dev/null || true

# ---- Runtime Stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=backend-build /app .
ENV NODE_ENV=production
ENV LOG_LEVEL=silent

# Expose port for Fastify
EXPOSE 3000

# Start web server (serves API and static frontend)
CMD ["node", "dist/server.js"]
