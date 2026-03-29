# Boilerworks Nuxt Full

> Full-stack Nuxt 3 application with Vue 3, Nitro server, PostgreSQL, and Drizzle ORM.

Nuxt 3 full-stack application with session-based auth, group-based permissions, products/categories CRUD, forms engine, workflow engine, and a dark admin theme. Built with Vue 3 Composition API, Nitro server for API routes, Drizzle ORM for database access, and Tailwind CSS for styling.

## Quick Start

```bash
# Start PostgreSQL
cd docker && docker compose up -d postgres-local && cd ..

# Install dependencies
npm install

# Push database schema and seed
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3005 and login with `admin@boilerworks.dev` / `admin123!`.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 3 + Vue 3 Composition API |
| Server | Nitro |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | Session-based (bcrypt + SHA256) |
| Permissions | Group-based |
| Styling | Tailwind CSS (dark theme) |
| Testing | Vitest |
| CI | GitHub Actions |

## Docker

```bash
cd docker
docker compose up -d
```

This starts both the Nuxt app (port 3005) and PostgreSQL (port 5450).

## Testing

```bash
npm run test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Boilerworks is a [Conflict](https://weareconflict.com) brand. CONFLICT is a registered trademark of Conflict LLC.
