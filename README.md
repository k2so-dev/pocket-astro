# pocket-astro

Astro + PocketBase + Vue 3 starter. Server-rendered pages for SEO, Vue islands with shadcn-vue, and an SPA cabinet on the same components. One command to deploy on a 1 GB VPS with automatic HTTPS.

## Stack

- [Astro](https://astro.build) in server mode on the [Bun](https://bun.sh) runtime
- [PocketBase](https://pocketbase.io) with the typed JS SDK and realtime
- [Vue 3](https://vuejs.org) islands and SPA with [vue-router](https://router.vuejs.org)
- [shadcn-vue](https://shadcn-vue.com) full component catalog, [Tailwind CSS 4](https://tailwindcss.com)
- Docker Compose, [Caddy](https://caddyserver.com) with Let's Encrypt, Make

## Why server mode

Pages read PocketBase on every request, so content changes are live without rebuilds or deploy hooks. Astro and PocketBase talk over the Docker network in under 2 ms. Idle memory is about 80 MB for Astro and 10 MB for PocketBase.

Pages that do not depend on data can opt into static generation with `export const prerender = true`.

## Requirements

- Docker with Compose
- Make

Bun is not required on the host. All commands run in containers.

## Quick start

```sh
git clone https://github.com/k2so-dev/pocket-astro.git
cd pocket-astro
make init
make dev
make admin
```

- Site: http://localhost:4321
- App: http://localhost:4321/app
- PocketBase admin: http://localhost:8090/_/

## Deploy

On a fresh VPS with Docker installed and DNS pointing to it:

```sh
git clone https://github.com/k2so-dev/pocket-astro.git
cd pocket-astro
make init
nano .env
make swap
make deploy
make admin
```

Set `DOMAIN`, `ACME_EMAIL` and `SITE_URL=https://your.domain` in `.env`. `make swap` adds a 2 GB swapfile, recommended on 1 GB machines for the build step. Run `make deploy` again to update: it pulls, rebuilds and restarts.

Caddy routes `/api/*` and `/_/*` to PocketBase and everything else to Astro.

## PocketBase API

Server side, every request gets its own authenticated client:

```astro
---
const posts = await Astro.locals.pb.collection("posts").getList(1, 20)
const user = Astro.locals.user
---
```

Client side, islands and the SPA share one client:

```ts
import { pb } from "@/lib/pb-client"
import { useAuth } from "@/composables/useAuth"
import { useRealtime } from "@/composables/useRealtime"

const { user, login, logout } = useAuth()
useRealtime("posts", "*", (event) => console.log(event.action, event.record))
```

Auth is stored in the `pb_auth` cookie, so SSR pages and the browser see the same session.

Generate types after changing collections:

```sh
make types
```

## Components

All shadcn-vue components are in `src/components/ui`. Use them in Vue files and islands:

```astro
---
import { Button } from "@/components/ui/button"
---
<Button client:load>Click</Button>
```

For static links use `buttonVariants()` without hydration:

```astro
<a href="/app" class={buttonVariants()}>Open app</a>
```

Add or update components with `make shadcn add <name>`.

## Commands

| Command | Description |
| --- | --- |
| `make init` | Create `.env` with encryption key |
| `make dev` | PocketBase and Astro dev server |
| `make up` | Build and run PocketBase and Astro on localhost |
| `make deploy` | Pull, build and run with Caddy on `DOMAIN` |
| `make down` | Stop everything |
| `make logs [svc]` | Follow logs |
| `make admin` | Create or update a superuser |
| `make migrate [cmd]` | PocketBase migrations |
| `make types` | Generate `src/lib/pb-types.ts` |
| `make check` | Type-check Astro and Vue |
| `make bun [cmd]` | Run bun in the dev container |
| `make shadcn [cmd]` | Run shadcn-vue CLI |
| `make swap [size]` | Enable swapfile |
| `make upgrade` | Pull latest images |

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PROJECT_NAME` | directory name | Compose project name |
| `ENCRYPTION_KEY` | generated | PocketBase settings encryption |
| `PB_VERSION` | `0.40.4` | PocketBase image tag |
| `PB_BIND`, `PB_PORT` | `127.0.0.1`, `8090` | PocketBase host binding |
| `ASTRO_BIND`, `ASTRO_PORT` | `127.0.0.1`, `4321` | Astro host binding |
| `SITE_URL` | `http://localhost:4321` | Canonical URL and sitemap |
| `DOMAIN` | | Domain for Caddy |
| `ACME_EMAIL` | | Let's Encrypt email |
| `TZ` | `UTC` | PocketBase timezone |

## Structure

```
pb/                 data, hooks, migrations
src/components/ui/  shadcn-vue components
src/composables/    useAuth, useRealtime
src/layouts/        Astro layouts
src/lib/            pb clients, generated types, utils
src/pages/          Astro routes, /app is the SPA entry
src/spa/            Vue SPA router and pages
src/middleware.ts   per-request PocketBase client
```
