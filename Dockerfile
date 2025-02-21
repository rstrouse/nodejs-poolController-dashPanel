FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:23-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs \
    && apk add git tzdata

ENV NODE_ENV production

COPY --from=builder --chown=nodejs:nodejs /app ./
#hacky way to fix permissions
USER root 
RUN chown nodejs:nodejs /app
USER nodejs 

EXPOSE 5150

CMD ["node", "dist/app.js"]
