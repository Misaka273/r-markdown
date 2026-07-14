import { ref, onMounted, onUnmounted } from 'vue'
import { getSetting } from '@/config/settings'

export function useSetting<T>(key: string) {
  const value = ref<T>(getSetting<T>(key))

  const handler = (e: Event) => {
    const { key: k, value: v } = (e as CustomEvent).detail
    if (k === key) value.value = v as T
  }

  onMounted(() => window.addEventListener('setting-changed', handler))
  onUnmounted(() => window.removeEventListener('setting-changed', handler))

  return value
}
