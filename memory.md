# Boilerworks Memory

This file is the **AI context seed** for the Boilerworks Nuxt Full template. It captures decisions, constraints, and non-obvious facts that are not derivable from reading a single file.

For conventions and patterns, see [`bootstrap.md`](bootstrap.md).

---

## Template purpose

Full-stack Nuxt 3 starter: Vue 3 Composition API, Nitro server API routes, PostgreSQL 16 via Drizzle ORM, Tailwind CSS dark admin theme. Ships with session-based auth (bcrypt + SHA256 token hashing), group-based permissions, items/categories CRUD, a forms engine, and a workflow engine.

## Key architectural decisions

| Decision                                 | Why                                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Session auth, not JWT                    | Tokens stored SHA256-hashed; `server/middleware/01.auth.ts` populates `event.context.user` on every request |
| UUID primary keys on all tables          | Never expose integer PKs                                                                                    |
| Soft deletes (`deleted_at`/`deleted_by`) | Never hard-delete rows                                                                                      |
| Audit logging on all mutations           | Consistent with the rest of the fleet                                                                       |
| Response shapes                          | `{ok, errors, data}` for mutations; `{ok, data, total, page, pageSize}` for lists                           |

## Ports

- Dev server: **3005** (`nuxt dev --port 3005`; `devServer.port` in `nuxt.config.ts`)
- Docker: host **3000** -> container 3005
- PostgreSQL: compose publishes host **5432**

## Things that bite newcomers

- **Postgres port mismatch (open P0)** — code defaults (`.env.example`, `drizzle.config.ts`, `nuxt.config.ts`, `server/database/seed.ts`) point `DATABASE_URL` at `localhost:5450`, but the compose file publishes `5432:5432`, so the README Quick Start fails with ECONNREFUSED until one side is aligned. Tracked in fleet-audit issue #17.
- Default credentials are `admin@boilerworks.dev` / `admin123!` and `SESSION_SECRET` defaults to `change-me-in-production` — change all of them before any deploy.

## Release status

Template is functional; CI green (lint, test, typecheck, npm audit). Open hygiene and dependency items (including the Nuxt 3 -> 4 migration) are tracked in fleet-audit issue #17.
