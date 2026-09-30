FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && apk add --no-cache openssl
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY prisma ./prisma
RUN ./node_modules/.bin/prisma generate
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable && apk add --no-cache openssl
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY prisma ./prisma
RUN ./node_modules/.bin/prisma generate
COPY --from=builder /app/dist ./dist
RUN chown -R node:node /app
ENV NODE_ENV=production
ENV PORT=4000
USER node
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/server.js"]
