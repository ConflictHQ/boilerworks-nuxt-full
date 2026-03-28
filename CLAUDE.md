# Claude -- Boilerworks Nuxt Full

Primary conventions doc: [`bootstrap.md`](bootstrap.md)

Read it before writing any code.

## Stack

- **Framework**: Nuxt 4
- **UI**: Vue 3
- **Server**: Nitro
- **Database**: D1 or Turso
- **Storage**: Cloudflare R2
- **Deployment**: Cloudflare Pages

## Edge Template

This is an edge template. Full-stack in one framework -- SSR + client + API routes via Nitro server. Production deployment targets Cloudflare Pages, not Docker. Local development uses `nuxi dev`.

## Status

This template is planned. See the [stack primer](../primers/nuxt-full/PRIMER.md) for architecture decisions and build order.
