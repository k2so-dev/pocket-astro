FROM oven/bun:1 AS build
WORKDIR /app
ARG SITE_URL
ENV SITE_URL=$SITE_URL
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun --bun astro build

FROM oven/bun:1-slim
WORKDIR /app
ENV HOST=0.0.0.0 PORT=4321
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production && rm -rf ~/.bun/install/cache
COPY --from=build /app/dist ./dist
USER bun
EXPOSE 4321
CMD ["bun", "./dist/server/entry.mjs"]
