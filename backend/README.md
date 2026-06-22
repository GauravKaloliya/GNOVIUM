# GNOVIUM - API

Production-style Flask API for the Gnovium Knowledge OS schema.

## What Is Included

- Versioned API: `/api/v1`
- Clean layers: routes, schemas, services, repositories, models
- JWT access and refresh token auth
- Workspace, entity, entity type, property, block, relation, branch, version, search, AI, governance, file, notification, and job modules
- PostgreSQL schema support with `pgvector`, `tsvector`, trigram extension, and soft-delete-safe tables
- Redis-ready caching/job/rate-limit foundation
- Ollama-ready AI pipeline through an AI service, retriever, and context builder
- S3 presigned upload support
- Structured JSON errors, request IDs, CORS, rate limiting, and activity/event tables

## Run Locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/flask --app run.py run --debug
```

Health check:

```bash
curl http://localhost:5000/health
```

Register and login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gnovium.dev","password":"change-me-123","name":"Admin"}'

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gnovium.dev","password":"change-me-123"}'
```

Use the returned access token:

```bash
curl http://localhost:5000/api/v1/workspaces/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Architecture

Routes only handle HTTP, validation, auth, and response formatting. Services own business behavior. Repositories own database access. Models map the SQL schema. AI, graph, governance, eventing, jobs, and sync live as separate domains so the codebase can grow without turning into one giant `routes.py`.

## Configuration

This project reads external services from `.env`. Keep that file private. `schema.sql` is the authoritative database schema, including `users.password_hash` and `sessions` for refresh-token revocation.

## Vercel Production

The API can deploy from the repository root. The root `api/index.py` file imports this Flask app, and root `vercel.json` rewrites all traffic to that function.

Production values belong in Vercel environment variables. Use `backend/.env.production` as the local production reference and `backend/.env.production.example` as the shareable template. Set `AUTO_CREATE_TABLES=false` in production and apply `schema.sql` to Neon before serving traffic.

Required production variables:

```bash
FLASK_ENV=production
SECRET_KEY=...
JWT_SECRET_KEY=...
DATABASE_URL=...
REDIS_URL=...
CORS_ORIGINS=https://www.gnovium.com,https://*.vercel.app
ALLOWED_HOSTS=www.gnovium.com,*.vercel.app
AUTO_CREATE_TABLES=false
REQUIRE_REDIS=true
```
