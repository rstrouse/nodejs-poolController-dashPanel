FROM node:lts-alpine as build
RUN apk add --no-cache make gcc g++ python linux-headers udev tzdata
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --production

FROM node:lts-alpine
RUN mkdir /app && chown node:node /app && mkdir /app/data && chown node:node /app/data
WORKDIR /app
COPY --chown=node:node --from=build /app .
USER node
ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/app.js"]
