// ===== 字典数据组合式函数（Composable）=====
// Vue3 组合式 API 的可复用逻辑封装，类似 React 的自定义 Hook
// 功能：根据字典类型从后端获取字典数据，并提供响应式的选项列表和加载状态
// 缓存策略：使用 Map 缓存已加载的字典，避免重复请求
import { ref, onMounted } from 'vue'
import { getDictByType } from '../api/dict'
import type { DictItem } from '../api/dict'

// 模块级缓存：所有使用 useDict 的组件共享同一个缓存 Map
const cache = new Map<string, DictItem[]>()

export function useDict(dictType: string) {
  const options = ref<DictItem[]>([]) // 字典选项列表（响应式）
  const loading = ref(false) // 加载状态

  // load 函数：从缓存或 API 加载字典数据
  async function load(force = false) {
    // 命中缓存且不强制刷新时，直接使用缓存数据
    if (!force && cache.has(dictType)) {
      options.value = cache.get(dictType)!
      return
    }

    loading.value = true
    try {
      const data = await getDictByType(dictType)
      options.value = data
      cache.set(dictType, data) // 写入缓存
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  // onMounted：组件挂载时自动加载字典数据
  onMounted(() => {
    load()
  })

  return { options, loading, load }
}
