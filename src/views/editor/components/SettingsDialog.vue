<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import BaseDialog from '@/components/BaseDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { checkForUpdates } from '@/composables/useAutoUpdater'
import type { Update } from '@tauri-apps/plugin-updater'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const ZOOM_PRESETS = [50, 75, 80, 90, 100, 110, 125, 150, 175, 200]
const STORE_KEY = 'editor-page-zoom'
const isTauri = import.meta.env.VITE_TAURI === 'true'

const currentZoom = ref(loadZoom())

const updateChecking = ref(false)
const updateMessage = ref('')
const updateError = ref(false)

const updateDialogVisible = ref(false)
const updateDialogVersion = ref('')
const pendingUpdate = ref<Update | null>(null)
const downloading = ref(false)
const downloadProgress = ref(0)

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

async function manualCheckUpdate() {
  updateChecking.value = true
  updateMessage.value = ''
  updateError.value = false

  const result = await checkForUpdates()

  if (result.error) {
    updateMessage.value = result.error
    updateError.value = true
  } else if (result.update) {
    pendingUpdate.value = result.update
    updateDialogVersion.value = result.update.version
    updateDialogVisible.value = true
  } else {
    updateMessage.value = '已是最新版本'
    updateError.value = false
  }

  updateChecking.value = false
}

async function doDownloadUpdate() {
  updateDialogVisible.value = false
  if (!pendingUpdate.value) return

  downloading.value = true
  downloadProgress.value = 0

  try {
    let total = 0
    let totalSize = 0
    await pendingUpdate.value.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        totalSize = event.data.contentLength ?? 0
      } else if (event.event === 'Progress') {
        total += event.data.chunkLength
        if (totalSize > 0) {
          downloadProgress.value = Math.round((total / totalSize) * 100)
        }
      }
    })
    // downloadAndInstall 成功后会自动重启安装，不会执行到这里
  } catch {
    updateMessage.value = '安装失败，请稍后重试'
    updateError.value = true
    downloading.value = false
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

    <!-- 检查更新（仅桌面端） -->
    <section v-if="isTauri" class="mt-6 pt-6 border-t border-[#f0f0f0] dark:border-[#333]">
      <h3 class="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] mb-3">
        版本更新
      </h3>
      <div class="flex items-center gap-3 flex-wrap">
        <button
          class="cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-4 py-1.5 text-[12px] font-medium text-[#666] transition-colors hover:border-[#ccc] hover:bg-[#f5f5f5] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999] dark:hover:border-[#666] dark:hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="updateChecking || downloading"
          @click="manualCheckUpdate"
        >
          {{ updateChecking ? '检查中…' : downloading ? '下载中…' : '检查更新' }}
        </button>
        <span
          v-if="updateMessage"
          class="text-[12px]"
          :class="updateError ? 'text-[#e74c3c]' : 'text-[var(--accent-green)]'"
        >
          {{ updateMessage }}
        </span>
      </div>
      <!-- 下载进度 -->
      <div v-if="downloading" class="mt-3">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-[12px] text-[#666] dark:text-[#999]">正在下载更新...</span>
          <span class="text-[12px] font-medium text-[var(--accent)]">{{ downloadProgress }}%</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-[#eee] dark:bg-[#444] overflow-hidden">
          <div
            class="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            :style="{ width: downloadProgress + '%' }"
          />
        </div>
      </div>
    </section>

    <!-- 更新确认弹窗 -->
    <ConfirmDialog
      v-model:visible="updateDialogVisible"
      title="发现新版本"
      :message="`版本 ${updateDialogVersion} 可用，是否立即下载安装？`"
      confirm-text="立即更新"
      @confirm="doDownloadUpdate"
      @cancel="updateDialogVisible = false"
    />
  </BaseDialog>
</template>
