FROM node:20-bookworm AS base

# basic tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# enable pnpm
RUN corepack enable

WORKDIR /app

# copy dependency files first (better docker cache)
# COPY package.json pnpm-lock.yaml* ./

# RUN pnpm install --frozen-lockfile || true

# copy app code
COPY . .

CMD ["tail", "-f", "/dev/null"]