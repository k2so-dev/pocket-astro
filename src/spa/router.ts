import { createRouter, createWebHistory } from "vue-router"
import { pb } from "@/lib/pb-client"

export const router = createRouter({
  history: createWebHistory("/app/"),
  routes: [
    { path: "/", component: () => import("@/spa/pages/Home.vue"), meta: { auth: true } },
    { path: "/login", component: () => import("@/spa/pages/Login.vue") },
    { path: "/:path(.*)*", redirect: "/" },
  ],
})

router.beforeEach((to) => {
  if (to.meta.auth && !pb.authStore.isValid) return "/login"
})
