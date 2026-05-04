# million-checkbox

`million-checkbox` is a TypeScript/Express application for a real-time checkbox dashboard. It uses Socket.IO for live updates, Redis/Valkey for shared checkbox state and pub/sub, PostgreSQL with Drizzle ORM for database access, and an external OIDC provider for login.

## Features

- Express HTTP API written in TypeScript.
- Socket.IO server for real-time checkbox updates.
- Redis/Valkey-backed checkbox state.
- Redis pub/sub channel for broadcasting checkbox changes between server instances.
- Basic per-socket rate limiting for checkbox updates.
- OIDC login callback, logout, profile, and protected dashboard routes.
- PostgreSQL connection through Drizzle ORM.
- Docker Compose setup for the app, Postgres, and Valkey.

## Tech Stack

- Node.js 20
- TypeScript
- Express 5
- Socket.IO
- ioredis
- PostgreSQL
- Drizzle ORM and Drizzle Kit
- JSON Web Tokens with JWKS verification
- pnpm
- Docker and Docker Compose

## Project Structure

```txt
.
+-- public/
|   `-- index.html              # Dashboard UI served by /dashboard
+-- src/
|   +-- common/
|   |   +-- config/env.ts       # Environment variable validation
|   |   +-- db/                 # Drizzle database setup and schema
|   |   +-- middleware/         # Shared Express middleware
|   |   `-- utils/              # API helper classes/utilities
|   +-- modules/
|   |   `-- auth/               # OIDC auth routes, controller, service
|   +-- redis-connection.ts     # Redis, publisher, and subscriber clients
|   `-- index.ts                # HTTP and Socket.IO server entrypoint
+-- docker-compose.yml
+-- Dockerfile
+-- example.env
+-- package.json
`-- tsconfig.json
```

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- Docker and Docker Compose, if running the included services locally
- PostgreSQL database
- Redis or Valkey server
- OIDC provider compatible with the app's authorize, token, issuer, and JWKS endpoints. This project is designed to work with [`oidc-auth-ts`](https://github.com/arbabhsiddiqui/oidc-auth-ts).

## Environment Setup

Create a local `.env` file from the example:

```sh
cp example.env .env
```

Then fill in the values:

```env
NODE_ENV=
PORT=
DATABASE_URI=
OIDC_INTERNAL_URL=
OIDC_ISSUER_URL=
```

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment. Supported values are `development`, `production`, and `test`. | `development` |
| `PORT` | HTTP server port. | `8080` |
| `DATABASE_URI` | PostgreSQL connection string used by Drizzle and the pg pool. | `postgresql://admin:admin@localhost:5445/million_checkbox_db` |
| `OIDC_INTERNAL_URL` | Internal URL used by the server to call the OIDC provider token and JWKS endpoints. | `http://localhost:6001` |
| `OIDC_ISSUER_URL` | Issuer URL expected when verifying JWT access tokens. | `http://localhost:6001` |

The app also defines defaults for `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` in `src/common/config/env.ts`, but the current token exchange code uses hard-coded client credentials in `src/modules/auth/auth.service.ts`.

For the OIDC provider, use the companion project: [`arbabhsiddiqui/oidc-auth-ts`](https://github.com/arbabhsiddiqui/oidc-auth-ts).

## Installation

Install dependencies:

```sh
pnpm install
```

## Running Locally

Start the development server:

```sh
pnpm dev
```

The server listens on the configured `PORT`. By default, `src/common/config/env.ts` uses port `8080` when no `PORT` is provided.

Useful local URLs:

- `GET /` - login landing page.
- `GET /callback` - OIDC callback route.
- `GET /profile` - protected profile page.
- `GET /dashboard` - protected checkbox dashboard.
- `GET /checkboxes` - returns the current checkbox state as JSON.
- `GET /logout` - clears the access token cookie and redirects home.

## Docker Compose

The included `docker-compose.yml` defines:

- `app` - Node.js container for the application.
- `postgres` - PostgreSQL 17 database exposed locally on port `5445`.
- `valkey` - Valkey server used as the Redis-compatible backend.

Start the services:

```sh
docker compose up -d
```

Enter the app container if needed:

```sh
docker compose exec app bash
```

The app container currently runs `tail -f /dev/null`, so start the development process manually inside the container:

```sh
pnpm install
pnpm dev
```

The Compose file also expects an external Docker network named `oidc-auth-ts_app_network` so the app can communicate with the OIDC provider from [`oidc-auth-ts`](https://github.com/arbabhsiddiqui/oidc-auth-ts).

## Database

Generate Drizzle migrations:

```sh
pnpm db:generate
```

Run Drizzle migrations:

```sh
pnpm db:migrate
```

Open Drizzle Studio:

```sh
pnpm studio
```

## Build and Start

Build the TypeScript project:

```sh
pnpm build
```

Start the compiled app:

```sh
pnpm start
```

## Real-Time Checkbox Flow

1. The dashboard connects to the Socket.IO server.
2. A client emits `client:checkbox-change` with a checkbox index and checked state.
3. The server checks the per-socket Redis rate limit.
4. The server updates the `checkbox-state` value in Redis/Valkey.
5. The server publishes the change to `internal-server:checkbox:change`.
6. Subscribers receive the update and emit `server:checkbox-change` to connected clients.

## Authentication Flow

1. The home page links to the external OIDC authorize endpoint from [`oidc-auth-ts`](https://github.com/arbabhsiddiqui/oidc-auth-ts).
2. The OIDC provider redirects back to `/callback` with an authorization code.
3. The server exchanges the code for an access token.
4. The access token is stored in an HTTP-only cookie.
5. Protected routes verify the token using the OIDC provider's JWKS endpoint.

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Runs TypeScript in watch mode and starts the server after successful compilation. |
| `pnpm build` | Compiles TypeScript into `dist/`. |
| `pnpm start` | Starts the compiled server from `dist/index.js`. |
| `pnpm studio` | Opens Drizzle Studio. |
| `pnpm db:generate` | Generates Drizzle migration files. |
| `pnpm db:migrate` | Applies Drizzle migrations. |
