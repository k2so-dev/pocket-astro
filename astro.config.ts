import node from "@astrojs/node"
import sitemap from "@astrojs/sitemap"
import vue from "@astrojs/vue"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"

const ssr = process.env.MODE === "ssr"
const pbDev = process.env.PB_URL ?? "http://127.0.0.1:8090"

export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: ssr ? "server" : "static",
  adapter: ssr ? node({ mode: "standalone" }) : undefined,
  integrations: [vue(), sitemap({ filter: (page) => !new URL(page).pathname.startsWith("/app") })],
  server: { host: true, port: 4321 },
  env: {
    schema: {
      PB_URL: envField.string({ context: "server", access: "secret", default: "http://127.0.0.1:8090" }),
      PUBLIC_PB_URL: envField.string({ context: "client", access: "public", default: "/" }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api": { target: pbDev, changeOrigin: true },
        "/_": { target: pbDev, changeOrigin: true },
      },
    },
  },
})
