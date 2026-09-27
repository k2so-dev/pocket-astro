import { mkdir, readdir, rename, rm, symlink } from "node:fs/promises"
import { $ } from "bun"

const root = process.env.PUBLIC_DIR ?? "pb/public"
const port = Number(process.env.BUILDER_PORT ?? 4322)
const delay = Number(process.env.BUILD_DELAY ?? 3000)
const keep = Number(process.env.BUILD_KEEP ?? 3)

let timer: ReturnType<typeof setTimeout> | undefined
let building = false
let pending = false

async function prune() {
  const releases = (await readdir(`${root}/releases`)).sort().reverse()
  for (const name of releases.slice(keep)) await rm(`${root}/releases/${name}`, { recursive: true, force: true })
}

async function build() {
  if (building) {
    pending = true
    return
  }
  building = true
  const release = `releases/${Date.now()}`
  const started = performance.now()
  try {
    await mkdir(`${root}/releases`, { recursive: true })
    await $`bun --bun astro build --outDir ${root}/${release}`.quiet()
    await rm(`${root}/current.tmp`, { force: true })
    await symlink(release, `${root}/current.tmp`)
    await rename(`${root}/current.tmp`, `${root}/current`)
    await prune()
    console.log(`built ${release} in ${Math.round(performance.now() - started)}ms`)
  } catch (error) {
    console.error("build failed", error)
    await rm(`${root}/${release}`, { recursive: true, force: true })
  } finally {
    building = false
    if (pending) {
      pending = false
      schedule()
    }
  }
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(build, delay)
}

if (process.argv.includes("--once")) {
  await build()
  process.exit(0)
}

Bun.serve({
  port,
  fetch(request) {
    if (request.method !== "POST") return new Response("ok")
    schedule()
    return new Response("scheduled", { status: 202 })
  },
})

console.log(`builder listening on ${port}`)
await build()
