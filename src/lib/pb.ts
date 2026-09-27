import PocketBase from "pocketbase"
import type { TypedPocketBase } from "@/lib/pb-types"

export function createPb(url: string) {
  return new PocketBase(url) as TypedPocketBase
}
