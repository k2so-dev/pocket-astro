import type { RecordSubscription } from "pocketbase"
import { onMounted, onUnmounted } from "vue"
import { pb } from "@/lib/pb-client"
import type { CollectionResponses } from "@/lib/pb-types"

export function useRealtime<T extends keyof CollectionResponses>(
  collection: T,
  topic: string,
  callback: (event: RecordSubscription<CollectionResponses[T]>) => void,
) {
  let unsubscribe: (() => Promise<void>) | undefined

  onMounted(async () => {
    unsubscribe = await pb.collection(collection).subscribe(topic, callback)
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
}
