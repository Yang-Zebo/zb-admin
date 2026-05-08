import type { Directive } from 'vue'
import { useAuthStore } from '../stores/auth'

export const vPermission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const permission = binding.value
    if (!permission) return

    const authStore = useAuthStore()
    if (!authStore.hasPermission(permission)) {
      el.parentNode?.removeChild(el)
    }
  },
}
