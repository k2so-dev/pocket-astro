import { PUBLIC_PB_URL } from "astro:env/client"

export type FileRecord = { id: string; collectionId: string }

export const defaultWidths = [320, 640, 960, 1280, 1920]

const base = PUBLIC_PB_URL.replace(/\/$/, "")

export function fileUrl(record: FileRecord, filename: string, thumb?: string) {
  if (!filename) return ""
  const url = `${base}/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`
  return thumb ? `${url}?thumb=${thumb}` : url
}

export function fileSrcset(record: FileRecord, filename: string, widths = defaultWidths) {
  return widths.map((width) => `${fileUrl(record, filename, `${width}x0`)} ${width}w`).join(", ")
}
