# Calliope — Boilerworks Nuxt Full
<!-- Agent shim for https://github.com/calliopeai/calliope-cli -->

Primary conventions doc: [`bootstrap.md`](bootstrap.md)
Context seed: [`memory.md`](memory.md)

Read both before writing any code.

---

## Project-specific notes

- Stack: Nuxt 3 / Vue 3 Composition API, Nitro server, Drizzle ORM, PostgreSQL 16, Tailwind, Vitest.
- UUID primary keys, soft deletes (`deleted_at`/`deleted_by`), and audit columns (`created_by`/`updated_by`) on all entity tables.
- API responses: `{ok, errors, data}` for mutations, `{ok, data, total, page, pageSize}` for lists; Zod validation on all inputs.
- Session-based auth (httpOnly cookies); group-based permissions checked in API route handlers, with superuser bypass.
- Dev: start Postgres via `docker compose up -d postgres-local`, then `npm run db:push && npm run db:seed && npm run dev` (port 3005).
