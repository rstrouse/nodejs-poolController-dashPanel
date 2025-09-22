### Build stage
FROM node:20-alpine AS build
LABEL maintainer="nodejs-poolController"

# Install build toolchain only for native deps (ssdp, possible future serial libs, etc.)
RUN apk add --no-cache make gcc g++ python3 linux-headers udev tzdata git

WORKDIR /app

# Copy manifests first to leverage Docker layer caching
COPY package*.json ./
COPY defaultConfig.json config.json

RUN npm ci
COPY . .
RUN npm run build

# Prune to production dependencies only (keeps node_modules consistent with lockfile)
RUN npm prune --production

### Runtime stage
FROM node:20-alpine AS runtime
ENV NODE_ENV=production

WORKDIR /app

# Prepare runtime directories (match application expectations)
RUN mkdir -p /app/logs /app/data /app/uploads /app/backups \
		&& chown -R node:node /app/logs /app/data /app/uploads /app/backups || true

# Copy only required runtime artifacts from build stage
COPY --chown=node:node --from=build /app/package*.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/defaultConfig.json ./defaultConfig.json
COPY --chown=node:node --from=build /app/config.json ./config.json
COPY --chown=node:node --from=build /app/README.md ./README.md
COPY --chown=node:node --from=build /app/themes ./themes
COPY --chown=node:node --from=build /app/pages ./pages
COPY --chown=node:node --from=build /app/scripts ./scripts
COPY --chown=node:node --from=build /app/server/messages/docs ./server/messages/docs

USER node

# Expose dashboard port (HTTP). HTTPS optional per config (5151)
EXPOSE 5150 5151

# Healthcheck: perform lightweight HTTP request to ensure app responding
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=5 \
    CMD curl -fsS http://127.0.0.1:5150/config/appVersion?health || exit 1

ENTRYPOINT ["node", "dist/app.js"]
