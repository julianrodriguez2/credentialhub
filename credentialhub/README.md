# CredentialHub

CredentialHub is a monorepo boilerplate for a modern SaaS application where skilled workers create verified professional profiles and employers browse those profiles.

## Stack

- Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn UI, React Query, Zustand
- Backend: FastAPI, SQLAlchemy ORM, PostgreSQL, Pydantic
- Auth: JWT with role-based access control (Worker, Employer, Admin)
- Infra: Docker + Docker Compose, env-based config, S3-compatible storage abstraction

## Monorepo Structure

```text
credentialhub/
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
    .env
    .env.example
    requirements.txt
  frontend/
    app/
      api/auth/
      api/employer/
      api/worker/
      dashboard/
        employer/
        worker/
      login/
      register/
    components/
    lib/
    .env
    .env.example
    package.json
  infra/
    backend.Dockerfile
    frontend.Dockerfile
    backend.env.example
    frontend.env.example
  docker-compose.yml
  README.md
```

## Local Development

### Prerequisites

- Docker Desktop

### Run with Docker Compose

1. From the repository root, move into the project:

```bash
cd credentialhub
```

2. Start all services:

```bash
docker-compose up --build
```

3. Open the apps:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend docs: http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL SQLAlchemy connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_ALGORITHM` | JWT algorithm (default `HS256`) |
| `JWT_EXPIRE_MINUTES` | Access token expiration in minutes |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| `STORAGE_PROVIDER` | Storage implementation selector (`s3` or fallback) |
| `S3_ENDPOINT_URL` | S3-compatible endpoint |
| `S3_REGION` | S3 region |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | Target bucket for documents |

### Frontend (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `BACKEND_URL` | Internal URL for frontend server routes to call backend |
| `JWT_SECRET` | Same signing key for server-side token verification |
| `NEXT_PUBLIC_APP_NAME` | Public app name label |

## Architecture Overview

### Backend

- `app/main.py`: FastAPI app bootstrap, CORS, startup table creation, router mounting
- `app/models/`: SQLAlchemy models (`User`, `WorkerProfile`, `EmployerProfile`, `Credential`, etc.)
- `app/schemas/`: Pydantic request/response schemas
- `app/services/auth_service.py`: registration, login validation, token issuance
- `app/api/v1/auth.py`: auth endpoints
- `app/api/v1/worker.py`: worker profile, experience, competencies, references endpoints
- `app/api/v1/worker_credentials.py`: worker credential upload/list/detail/delete endpoints
- `app/api/v1/employer.py`: employer worker directory and worker profile viewer endpoints
- `app/services/worker_service.py`: worker profile and CRUD business logic
- `app/services/employer_service.py`: employer-side worker search/profile aggregation logic
- `app/services/storage_service.py`: S3/MinIO file upload and deletion service
- `app/services/credential_status_service.py`: computed status (`valid`, `expiring`, `expired`)
- `app/api/deps.py`: JWT authentication and RBAC dependencies
- `app/services/storage.py`: S3-compatible storage abstraction

### Frontend

- App Router pages: `/login`, `/register`, `/dashboard`
- Route handlers in `app/api/auth/*` proxy to backend auth and set HTTP-only auth cookie
- Route handlers in `app/api/worker/*` proxy worker CRUD requests with JWT from cookies
- Route handlers in `app/api/employer/*` proxy employer worker discovery/profile requests
- `middleware.ts` protects `/dashboard` and redirects authenticated users away from auth pages
- Worker workspace pages:
  - `/dashboard/worker/profile`
  - `/dashboard/worker/experience`
  - `/dashboard/worker/competencies`
  - `/dashboard/worker/references`
  - `/dashboard/worker/credentials`
- Employer workspace pages:
  - `/dashboard/employer`
  - `/dashboard/employer/workers`
  - `/dashboard/employer/workers/[id]`
- Role-based redirects keep employers/admins out of worker routes
- Workers control employer visibility with `WorkerProfile.profile_visibility`
- React Query drives mutation state for login/register forms
- Zustand stores lightweight client auth state

## API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/admin-only` (admin role required)
- `GET /api/worker/profile`
- `PUT /api/worker/profile`
- `POST /api/worker/experience`
- `GET /api/worker/experience`
- `PUT /api/worker/experience`
- `DELETE /api/worker/experience?id=<uuid>`
- `POST /api/worker/competencies`
- `GET /api/worker/competencies`
- `DELETE /api/worker/competencies?id=<id>`
- `POST /api/worker/references`
- `GET /api/worker/references`
- `DELETE /api/worker/references?id=<id>`
- `POST /api/worker/credentials/upload`
- `GET /api/worker/credentials`
- `GET /api/worker/credentials/{id}`
- `DELETE /api/worker/credentials/{id}`
- `GET /api/employer/workers`
  - optional query params: `search`, `competency`, `years_experience`, `credential_status`
- `GET /api/employer/workers/{worker_id}`

## Notes

- JWT tokens are stored in an HTTP-only cookie (`credentialhub_token`) by frontend route handlers.
- The backend creates role-specific profiles for newly registered users:
  - `worker` -> `WorkerProfile` (`profile_visibility=false` by default)
  - `employer` -> `EmployerProfile`
  - `admin` -> no profile row by default
- This boilerplate uses SQLAlchemy `create_all` on startup. For production, introduce Alembic migrations.
- If you already have an existing database, add the visibility column manually before starting:
  - `ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS profile_visibility BOOLEAN NOT NULL DEFAULT FALSE;`
