# --- install + build (bun, because the lockfile is bun.lockb) ---
FROM oven/bun:1 AS build
WORKDIR /app

# better-sqlite3 falls back to node-gyp when no prebuilt binary matches,
# which needs python3/make/g++ (not shipped in the slim bun image)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# --- runtime (adapter-node output on a slim Node image) ---
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Quest DB lives at /app/data — mount a Coolify volume here for persistence
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000
CMD ["node", "build"]
