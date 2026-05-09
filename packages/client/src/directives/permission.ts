// ===== 权限指令 v-permission =====
// 用于按钮级别的权限控制
// 用法：<el-button v-permission="'sys:user:add'">新增</el-button>
// 原理：在元素挂载到 DOM 后，检查当前用户是否有对应权限，无权限则移除该元素
import type { Directive } from 'vue'
import { useAuthStore } from '../stores/auth'

export const vPermission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const permission = binding.value // 获取指令绑定的权限标识（如 'sys:user:add'）
    if (!permission) return

    const authStore = useAuthStore()
    if (!authStore.hasPermission(permission)) {
      el.parentNode?.removeChild(el) // 无权限 → 从 DOM 中移除该元素
    }
  },
}
