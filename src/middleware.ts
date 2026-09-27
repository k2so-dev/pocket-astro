import { PB_URL } from "astro:env/server"
import { defineMiddleware } from "astro:middleware"
import { createPb } from "@/lib/pb"

export const onRequest = defineMiddleware(async ({ locals, request, url, isPrerendered }, next) => {
  const pb = createPb(PB_URL)
  locals.pb = pb
  locals.user = null

  if (isPrerendered) return next()

  const cookie = request.headers.get("cookie") ?? ""
  pb.authStore.loadFromCookie(cookie)

  if (pb.authStore.isValid && pb.authStore.record) {
    try {
      await pb.collection(pb.authStore.record.collectionName).authRefresh()
    } catch {
      pb.authStore.clear()
    }
  }

  locals.user = pb.authStore.record

  const response = await next()

  if (cookie.includes("pb_auth=")) {
    const secure = url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"
    try {
      response.headers.append("set-cookie", pb.authStore.exportToCookie({ httpOnly: false, secure }))
    } catch {}
  }

  return response
})
