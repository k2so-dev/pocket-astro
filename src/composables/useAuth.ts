import { ref } from "vue"
import { pb } from "@/lib/pb-client"

const user = ref(pb.authStore.record)

pb.authStore.onChange((_, record) => {
  user.value = record
})

export function useAuth() {
  return {
    user,
    login: (email: string, password: string) => pb.collection("users").authWithPassword(email, password),
    register: (email: string, password: string) =>
      pb.collection("users").create({ email, password, passwordConfirm: password }),
    logout: () => pb.authStore.clear(),
  }
}
