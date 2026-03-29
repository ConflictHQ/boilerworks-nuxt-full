# Claude -- Boilerworks Nuxt Full

Primary conventions doc: [`bootstrap.md`](bootstrap.md)

Read it before writing any code.

## Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Server**: Nitro (API routes in `server/api/`)
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Auth**: Session-based, bcrypt + SHA256 token hashing
- **Permissions**: Group-based, checked in route handlers
- **Styling**: Tailwind CSS, dark theme
- **Testing**: Vitest
- **Docker**: `docker/docker-compose.yaml`

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run test         # Run vitest
npm run lint         # ESLint
npm run format:check # Prettier check
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
```

## Architecture

All API routes live in `server/api/` and follow Nitro conventions. Auth middleware in `server/middleware/01.auth.ts` populates `event.context.user` on every request.

Response shapes: `{ok, errors, data}` for mutations, `{ok, data, total, page, pageSize}` for lists.

UUID primary keys on all tables. Soft deletes via `deleted_at`/`deleted_by` columns. Audit logging on all mutations.

## Database

Drizzle ORM schema in `server/database/schema.ts`. Use `npm run db:push` to sync schema, `npm run db:seed` to populate sample data.

## Ports

- Nuxt: 3005
- PostgreSQL: 5432

## Default Credentials

- Email: `admin@boilerworks.dev`
- Password: `admin123!`
