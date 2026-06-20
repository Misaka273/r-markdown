<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import type { DarkMode } from '@/composables/useDarkMode'
import { useDropdownGroup } from '@/composables/useDropdownGroup'

defineProps<{
  mode: DarkMode
}>()

const emit = defineEmits<{
  select: [mode: DarkMode]
}>()

const { toggle: groupToggle, isVisible } = useDropdownGroup('darkmode')

function toggle() {
  groupToggle(!isVisible.value)
}

function select(m: DarkMode) {
  emit('select', m)
  groupToggle(false)
}

function close(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dark-mode-toggle')) {
    groupToggle(false)
  }
}

onMounted(() => {
  document.addEventListener('click', close)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', close)
})
</script>

<template>
  <div class="dark-mode-toggle relative">
    <button
      class="w-7 h-7 rounded-full border-2 cursor-pointer flex items-center justify-center p-0 shrink-0 transition-all duration-200 hover:scale-110"
      :class="
        mode === 'dark'
          ? 'bg-[#2d3436] text-white border-white/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
          : 'bg-white text-gray-700 border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)]'
      "
      title="切换亮暗模式"
      @click.stop="toggle"
    >
      <Sun v-if="mode === 'light'" :size="15" />
      <Moon v-else-if="mode === 'dark'" :size="15" />
      <Monitor v-else :size="15" />
    </button>
    <div
      class="dark-mode-menu absolute top-full right-0 mt-2 p-1.5 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 w-36"
      :class="{ show: isVisible }"
    >
      <button
        class="dark-mode-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
        :class="{ active: mode === 'light' }"
        @click="select('light')"
      >
        <Sun :size="14" />
        亮色
      </button>
      <button
        class="dark-mode-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
        :class="{ active: mode === 'dark' }"
        @click="select('dark')"
      >
        <Moon :size="14" />
        暗色
      </button>
      <button
        class="dark-mode-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
        :class="{ active: mode === 'system' }"
        @click="select('system')"
      >
        <Monitor :size="14" />
        跟随系统
      </button>
    </div>
  </div>
</template>

<style scoped>
.dark-mode-menu {
  display: none;
}

.dark-mode-menu.show {
  display: block;
}

.dark-mode-option.active {
  background: var(--accent-light, rgba(108, 92, 231, 0.15));
  color: var(--accent, #6c5ce7);
  font-weight: 600;
}
</style>

<style>
/* Dark mode overrides for DarkModeToggle */
[data-theme='dark'] .dark-mode-toggle > button {
  background: #2d3436 !important;
  color: white !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}
[data-theme='dark'] .dark-mode-menu {
  background: #2a2a2e !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}
[data-theme='dark'] .dark-mode-option {
  color: #ccc !important;
}
[data-theme='dark'] .dark-mode-option:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>
