# CodeAtlas — Deployment Guide

## Overview

CodeAtlas is a Next.js 15 application with PostgreSQL + pgvector, Auth.js (NextAuth v5), GitHub OAuth, Google OAuth, and Gemini/Claude AI integration.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values.

### Required

| Variable | Description | How to obtain |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector | Neon, Supabase, Railway, or local Postgres |
| `AUTH_SECRET` | Auth.js session secret | `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | https://github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Same as above |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same as above |

### AI Provider (choose one)

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | `gemini` (default), `claude`, or `ollama` |
| `GEMINI_API_KEY` | Google AI API key (for gemini provider) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for claude provider) |

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in values in .env.local

# 3. Start PostgreSQL (Docker or local)
docker compose -f infra/compose/compose.yml up -d postgres

# 4. Apply database migrations
pnpm db:generate
pnpm db:migrate

# 5. Start development server
pnpm dev
# → http://localhost:3000
```

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set **Homepage URL** to your app URL (e.g., `http://localhost:3000`)
4. Set **Callback URL** to `http://localhost:3000/api/auth/callback/github`
5. Copy the Client ID and Client Secret to `.env.local`
6. **Important**: The app requests `repo` scope for private repository access. Users must re-authorize after this scope is added.

## Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth 2.0 Client ID
3. Set **Authorized redirect URI** to `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret to `.env.local`

## Database Setup

### Neon (Recommended for production)

1. Create a project at https://neon.tech
2. Copy the connection string from the dashboard
3. Set `DATABASE_URL` in `.env.local`
4. Enable the pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`

### Local PostgreSQL

```bash
# Using Docker
docker compose -f infra/compose/compose.yml up -d postgres

# Create databases
psql -U postgres -h localhost -c "CREATE DATABASE codeatlas;"
psql -U postgres -h localhost -c "CREATE DATABASE codeatlas_test;"
```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel dashboard
3. Set environment variables in Vercel project settings
4. Deploy — Vercel handles build and hosting automatically

### Docker

```bash
# Build the image
docker build -t codeatlas .

# Run with database
docker compose -f infra/compose/compose.yml --profile full up -d
```

### Self-hosted

```bash
# Build
pnpm build

# Start production server
pnpm start
# → http://localhost:3000
```

## Database Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Create new migration
pnpm db:migrate

# Deploy migrations (production)
pnpm db:deploy
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Type check
pnpm typecheck

# Build
pnpm build
```

## Troubleshooting

### "Missing required environment variable"
Ensure all required variables are set in `.env.local`.

### "GitHub needs re-auth"
The app requests `repo` scope for private repositories. Users must sign out and sign back in to grant the new scope.

### "AI provider not available"
Check that your API key is set correctly for the chosen provider (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, etc.).

### Database connection errors
Verify `DATABASE_URL` is correct and the database server is running. For Neon, ensure `sslmode=require` is in the connection string.

### Build fails with Prisma errors
Run `pnpm db:generate` to regenerate the Prisma client after schema changes.
