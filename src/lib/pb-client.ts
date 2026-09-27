import { PUBLIC_PB_URL } from "astro:env/client"
import { createPb } from "@/lib/pb"

export const pb = createPb(PUBLIC_PB_URL)

if (typeof document !== "undefined") {
  pb.authStore.loadFromCookie(document.cookie)
  pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: location.protocol === "https:" })
  })
}
