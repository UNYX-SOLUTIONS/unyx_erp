FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG API_PROXY_URL=http://localhost:4001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_PROXY_URL=$API_PROXY_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
