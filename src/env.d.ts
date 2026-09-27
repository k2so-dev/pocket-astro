declare namespace App {
  interface Locals {
    pb: import("@/lib/pb-types").TypedPocketBase
    user: import("pocketbase").AuthRecord
  }
}
