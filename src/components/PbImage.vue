<script setup lang="ts">
import { computed } from "vue"
import { defaultWidths, type FileRecord, fileSrcset, fileUrl } from "@/lib/files"

const props = withDefaults(
  defineProps<{
    record: FileRecord
    file: string
    alt: string
    widths?: number[]
    sizes?: string
    width?: number
    height?: number
    loading?: "lazy" | "eager"
  }>(),
  { widths: () => defaultWidths, sizes: "100vw", loading: "lazy" },
)

const src = computed(() => fileUrl(props.record, props.file, `${props.widths[props.widths.length - 1]}x0`))
const srcset = computed(() => fileSrcset(props.record, props.file, props.widths))
</script>

<template>
  <img
    v-if="file"
    :src="src"
    :srcset="srcset"
    :sizes="sizes"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    decoding="async"
  />
</template>
