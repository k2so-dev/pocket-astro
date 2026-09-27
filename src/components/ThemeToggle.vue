<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"

function toggle() {
  const dark = document.documentElement.classList.toggle("dark")
  localStorage.setItem("theme", dark ? "dark" : "light")
}
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Toggle theme" @click="toggle">
    <Sun class="hidden dark:block" />
    <Moon class="dark:hidden" />
  </Button>
</template>
