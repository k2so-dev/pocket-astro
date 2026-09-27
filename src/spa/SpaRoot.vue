<script setup lang="ts">
import { getCurrentInstance } from "vue"
import { Toaster } from "@/components/ui/sonner"
import { router } from "@/spa/router"

getCurrentInstance()?.appContext.app.use(router)
</script>

<template>
  <RouterView />
  <Toaster />
</template>
