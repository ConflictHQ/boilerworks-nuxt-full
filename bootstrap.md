# Boilerworks Nuxt Full -- Bootstrap

## Stack

Nuxt 3, Vue 3 Composition API, Nitro server, Drizzle ORM, PostgreSQL 16, Tailwind CSS, Vitest.

## Conventions

- UUID primary keys on all tables (`gen_random_uuid()`)
- Soft deletes: `deleted_at` / `deleted_by` columns, filtered in all queries
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by` on all entity tables
- API responses: `{ok, errors, data}` for mutations, `{ok, data, total, page, pageSize}` for lists
- Zod validation on all API inputs
- Session-based auth with httpOnly cookies
- Group-based permissions checked in API route handlers
- Superuser bypass on all permission checks

## File Layout

```
server/
  api/           # Nitro API routes (auto-scanned)
  database/      # Drizzle schema, migrations, seed
  middleware/     # Server middleware (auth)
  utils/         # Server utilities (auth, audit, response)
pages/           # Nuxt file-based routing
components/      # Vue components (auto-imported)
composables/     # Vue composables (auto-imported)
middleware/      # Client route middleware
layouts/         # Nuxt layouts
types/           # TypeScript types
```

## Development

```bash
# Start database
cd docker && docker compose up -d postgres-local

# Install and run
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```
