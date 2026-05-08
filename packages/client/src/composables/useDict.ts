import { ref, onMounted } from 'vue'
import { getDictByType } from '../api/dict'
import type { DictItem } from '../api/dict'

const cache = new Map<string, DictItem[]>()

export function useDict(dictType: string) {
  const options = ref<DictItem[]>([])
  const loading = ref(false)

  async function load(force = false) {
    if (!force && cache.has(dictType)) {
      options.value = cache.get(dictType)!
      return
    }

    loading.value = true
    try {
      const data = await getDictByType(dictType)
      options.value = data
      cache.set(dictType, data)
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    load()
  })

  return { options, loading, load }
}
