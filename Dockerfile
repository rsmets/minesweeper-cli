# ---- Frontend Build Stage ----
FROM node:24-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY frontend .
RUN pnpm build

# ---- Backend Build Stage ----
FROM node:24-alpine AS backend-build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY . .
# Copy frontend build output into backend for static serving
COPY --from=frontend-build /frontend/dist ./frontend/dist
RUN pnpm build

# ---- Runtime Stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=backend-build /app .
ENV NODE_ENV=production
ENV LOG_LEVEL=silent

# Expose port for Fastify
EXPOSE 3000

# Start backend (serves API and static frontend)
CMD ["node", "dist/index.js"]
