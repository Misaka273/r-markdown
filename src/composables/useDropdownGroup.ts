import { ref, computed } from 'vue'

const activeId = ref<string | null>(null)

export function useDropdownGroup(id: string) {
  function open() {
    activeId.value = id
  }

  function close() {
    if (activeId.value === id) {
      activeId.value = null
    }
  }

  function toggle(show: boolean) {
    if (show) {
      activeId.value = id
    } else if (activeId.value === id) {
      activeId.value = null
    }
  }

  const isVisible = computed(() => activeId.value === id)

  return { open, close, toggle, isVisible }
}
