<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import BaseDialog from '@/components/BaseDialog.vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const ZOOM_PRESETS = [50, 75, 80, 90, 100, 110, 125, 150, 175, 200]
const STORE_KEY = 'editor-page-zoom'

const currentZoom = ref(loadZoom())

function loadZoom(): number {
  try {
    const stored = localStorage.getItem(STORE_KEY)
    if (stored) {
      const val = parseFloat(stored)
      if (val >= 50 && val <= 200) return val
    }
  } catch { /* ignore */ }
  return 100
}

async function applyZoom(scale: number) {
  currentZoom.value = scale
  localStorage.setItem(STORE_KEY, String(scale))
  try {
    await invoke('set_page_zoom', { scale: scale / 100 })
  } catch {
    // 非 Tauri 环境忽略
  }
}

</script>

<template>
  <BaseDialog
    :visible="visible"
    title="编辑器设置"
    width="min(90vw, 680px)"
    :show-footer="false"
    @close="emit('close')"
  >
    <!-- 页面缩放 -->
    <section>
      <h3 class="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] mb-3">
        页面缩放
      </h3>
      <div class="flex flex-nowrap gap-2">
        <button
          v-for="p in ZOOM_PRESETS"
          :key="p"
          class="cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-150 shrink-0"
          :class="currentZoom === p
            ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
            : 'border-[#e5e5e5] bg-white text-[#666] hover:border-[#ccc] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999] dark:hover:border-[#666]'"
          @click="applyZoom(p)"
        >
          {{ p }}%
        </button>
      </div>
      <p class="text-[11px] text-[#999] dark:text-[#666] mt-2.5">
        当前缩放：{{ currentZoom }}%（设置会自动保存）
      </p>
    </section>
  </BaseDialog>
</template>
