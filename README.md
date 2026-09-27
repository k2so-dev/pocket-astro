# pocket-astro

Astro + PocketBase + Vue 3 starter. Static pages rebuilt automatically when content changes, Vue islands with shadcn-vue, and an SPA cabinet on the same components. Optional SSR. One command to deploy on a 1 GB VPS with automatic HTTPS.

## Stack

- [Astro](https://astro.build) static or server mode on the [Bun](https://bun.sh) runtime
- [PocketBase](https://pocketbase.io) with the typed JS SDK and realtime
- [Vue 3](https://vuejs.org) islands and SPA with [vue-router](https://router.vuejs.org)
- [shadcn-vue](https://shadcn-vue.com) full component catalog, [Tailwind CSS 4](https://tailwindcss.com)
- Docker Compose, [Caddy](https://caddyserver.com) with Let's Encrypt, Make

## How it works

Two modes, set with `MODE` in `.env`.

**static** (default). Astro prerenders the site into `pb/public`, PocketBase serves it together with the API. A PocketBase hook notifies the `builder` service on any record change in non-auth collections. The builder debounces changes (`BUILD_DELAY`, 3 s), builds into a new release folder and atomically switches the `pb/public/current` symlink. No downtime, no deploy hooks, no CI. Idle memory is about 12 MB for the builder and 13 MB for PocketBase. A small site builds in 2-4 s.

**ssr**. Astro runs as a Node-compatible server on Bun and reads PocketBase on every request. Use it when pages must be personalized or data changes too often for rebuilds. Idle memory is about 65 MB. Pages can still opt into static generation with `export const prerender = true`.

Both modes use the `oven/bun:1` image with the repository mounted. There is no Dockerfile.

The `/app` SPA is served by a PocketBase route in static mode and by Astro in ssr mode. Unknown pages get `src/pages/404.astro` with status 404 in both modes, API errors stay JSON.

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

- Dev site: http://localhost:4321
- Dev app: http://localhost:4321/app
- PocketBase admin: http://localhost:8090/_/

`make up` runs the production setup locally: in static mode the site is at http://localhost:8090.

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

Set `DOMAIN`, `ACME_EMAIL` and `SITE_URL=https://your.domain` in `.env`. `make swap` adds a 2 GB swapfile, recommended on 1 GB machines for the build step. Run `make deploy` again to update: it pulls and restarts, which triggers a fresh build.

Caddy routes `/api/*` and `/_/*` to PocketBase and everything else to PocketBase (static) or Astro (ssr).

Behind your own reverse proxy use `make up` and point it to `127.0.0.1:8090` (static) or split `/api/`, `/_/` to `8090` and the rest to `4321` (ssr). Disable proxy buffering for `/api/` so realtime works.

## PocketBase API

Server side, pages get a client in `Astro.locals.pb`. In static mode it runs at build time, in ssr mode per request with the user session in `Astro.locals.user`:

```astro
---
const posts = await Astro.locals.pb.collection("posts").getFullList()
---
```

For static pages with dynamic routes use `getStaticPaths`:

```astro
---
import { PB_URL } from "astro:env/server"
import { createPb } from "@/lib/pb"

export async function getStaticPaths() {
  const posts = await createPb(PB_URL).collection("posts").getFullList()
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }))
}

const { post } = Astro.props
---
```

## Images

PocketBase resizes images on the fly and caches thumbs, so builds stay light. Allow sizes in the file field **Thumbs** option, for example `320x0, 640x0, 960x0, 1280x0, 1920x0`. Sizes not listed return the original.

`PbImage` renders a responsive `<img>` with `srcset` from those widths. It works in `.astro` without hydration and inside Vue:

```astro
---
import PbImage from "@/components/PbImage.vue"
---
<PbImage record={post} file={post.cover} alt={post.title} sizes="(min-width: 768px) 50vw, 100vw" />
```

Props: `widths` (default `[320, 640, 960, 1280, 1920]`), `sizes` (default `100vw`), `loading` (default `lazy`), `width`, `height`.

For custom markup use the helpers from `@/lib/files`:

```ts
fileUrl(record, filename, "400x400")
fileSrcset(record, filename, [480, 960])
```

URLs are built from `PUBLIC_PB_URL`, never from the internal `PB_URL`, so they are valid in static builds, SSR and the browser.

Client side, islands and the SPA share one client:

```ts
import { pb } from "@/lib/pb-client"
import { useAuth } from "@/composables/useAuth"
import { useRealtime } from "@/composables/useRealtime"

const { user, login, logout } = useAuth()
useRealtime("posts", "*", (event) => console.log(event.action, event.record))
```

Auth is stored in the `pb_auth` cookie, so in ssr mode server pages and the browser see the same session.

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
| `make up` | Run PocketBase with builder (static) or Astro (ssr) |
| `make build` | Build the static site once |
| `make deploy` | Pull and run with Caddy on `DOMAIN` |
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
| `MODE` | `static` | `static` or `ssr` |
| `ENCRYPTION_KEY` | generated | PocketBase settings encryption |
| `PB_VERSION` | `0.40.4` | PocketBase image tag |
| `PB_BIND`, `PB_PORT` | `127.0.0.1`, `8090` | PocketBase host binding |
| `ASTRO_BIND`, `ASTRO_PORT` | `127.0.0.1`, `4321` | Astro host binding |
| `SITE_URL` | `http://localhost:8090` | Canonical URL and sitemap |
| `BUILD_DELAY` | `3000` | Debounce before rebuild, ms |
| `DOMAIN` | | Domain for Caddy |
| `ACME_EMAIL` | | Let's Encrypt email |
| `TZ` | `UTC` | PocketBase timezone |

## Structure

```
pb/                 data, hooks, migrations, public (builds)
scripts/builder.ts  debounced static builder
src/components/ui/  shadcn-vue components
src/components/     PbImage, ThemeToggle
src/composables/    useAuth, useRealtime
src/layouts/        Astro layouts
src/lib/            pb clients, generated types, utils
src/pages/          Astro routes, /app is the SPA entry
src/spa/            Vue SPA router and pages
src/middleware.ts   PocketBase client in locals, session in ssr mode
```
