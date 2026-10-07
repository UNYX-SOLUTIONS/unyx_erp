FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && apk add --no-cache openssl
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY prisma ./prisma
ENV DATABASE_URL_ALTOSA="postgresql://build:build@localhost:5432/build"
RUN ./node_modules/.bin/prisma generate && ./node_modules/.bin/prisma generate --schema prisma/schema-altosa.prisma
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json
ENV NODE_ENV=production
ENV PORT=4000
USER node
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/server.js"]
