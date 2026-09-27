<script setup lang="ts">
import { ClientResponseError } from "pocketbase"
import { ref } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/composables/useAuth"

const { login, register } = useAuth()
const router = useRouter()
const mode = ref<"login" | "register">("login")
const email = ref("")
const password = ref("")
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    if (mode.value === "register") await register(email.value, password.value)
    await login(email.value, password.value)
    router.push("/")
  } catch (error) {
    toast.error(error instanceof ClientResponseError ? error.message : "Something went wrong")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ mode === "login" ? "Sign in" : "Create account" }}</CardTitle>
        <CardDescription>Use your email and password</CardDescription>
      </CardHeader>
      <form @submit.prevent="submit">
        <CardContent class="grid gap-4">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" autocomplete="current-password" minlength="8" required />
          </div>
        </CardContent>
        <CardFooter class="mt-6 flex flex-col gap-2">
          <Button type="submit" class="w-full" :disabled="loading">
            {{ mode === "login" ? "Sign in" : "Sign up" }}
          </Button>
          <Button type="button" variant="link" @click="mode = mode === 'login' ? 'register' : 'login'">
            {{ mode === "login" ? "Create account" : "I have an account" }}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
