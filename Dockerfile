# ---- Build Stage ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runtime Stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
ENV LOG_LEVEL=silent

# Directly invokes the compiled entry point with Node.js for minimal image size and fastest startup. This avoids the need to install pnpm or npm in the runtime image
CMD ["node", "dist/index.js"]
