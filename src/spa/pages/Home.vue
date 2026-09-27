<script setup lang="ts">
import { useRouter } from "vue-router"
import ThemeToggle from "@/components/ThemeToggle.vue"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/composables/useAuth"

const { user, logout } = useAuth()
const router = useRouter()

function signOut() {
  logout()
  router.push("/login")
}
</script>

<template>
  <div class="container mx-auto p-6">
    <header class="flex items-center justify-between">
      <a href="/" class="font-semibold">pocket-astro</a>
      <div class="flex gap-2">
        <ThemeToggle />
        <Button variant="outline" @click="signOut">Sign out</Button>
      </div>
    </header>
    <Card class="mt-8">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Signed in as {{ user?.email }}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre class="overflow-auto text-xs">{{ user }}</pre>
      </CardContent>
    </Card>
  </div>
</template>
