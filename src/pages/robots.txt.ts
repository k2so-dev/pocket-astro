import type { APIRoute } from "astro"

export const prerender = true

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /app/",
      "Disallow: /_/",
      "",
      `Sitemap: ${new URL("sitemap-index.xml", site)}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  )
