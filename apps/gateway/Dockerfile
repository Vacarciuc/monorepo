FROM node:22-slim AS base
WORKDIR /app
RUN npm i -g corepack
RUN corepack enable
COPY package.json pnpm-lock.yaml ./

FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM base AS production
RUN apt-get -y update && apt-get -y install curl

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist/ dist/

ENTRYPOINT ["pnpm", "start:prod"]
