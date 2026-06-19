<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import BaseDialog from '@/components/BaseDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { getSetting, setSetting } from '@/config/settings'
import { autoUpdateEnabled, autoUpdatePending, autoUpdateRid, checkForUpdates, downloadUpdateWithRid, type UpdateInfo } from '@/composables/useAutoUpdater'
import { autoSaveEnabled, autoSaveInterval } from '@/composables/useEditorSettings'
import { testConnection } from '@/services/githubUploader'
import { useTheme } from '@/composables/useTheme'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const ZOOM_PRESETS = [50, 75, 80, 90, 100, 110, 125, 150, 175, 200]
const SAVE_INTERVAL_PRESETS = [0.5, 1, 2, 3, 5, 8, 10]
const isTauri = import.meta.env.VITE_TAURI === 'true'
const { colors } = useTheme()

// ── 设置 tab ──
const settingsTab = ref(isTauri ? 'basic' : 'github')

// ── 图床配置 ──
const githubRepo = ref(getSetting<string>('githubRepo'))
const githubToken = ref(getSetting<string>('githubToken'))
const githubBranch = ref(getSetting<string>('githubBranch'))

const githubTesting = ref(false)
const githubTestResult = ref<'ok' | 'fail' | ''>('')
const githubTestError = ref('')

function saveGitHubRepo(val: string) {
  githubRepo.value = val
  setSetting('githubRepo', val)
  githubTestResult.value = ''
  githubTestError.value = ''
}

function saveGitHubToken(val: string) {
  githubToken.value = val
  setSetting('githubToken', val)
  githubTestResult.value = ''
  githubTestError.value = ''
}

function saveGitHubBranch(val: string) {
  githubBranch.value = val
  setSetting('githubBranch', val)
  githubTestResult.value = ''
  githubTestError.value = ''
}

// ── 粘贴/拖拽上传方式 ──
const pasteDropMode = ref(getSetting<string>('pasteDropMode'))

function savePasteDropMode(val: string) {
  pasteDropMode.value = val
  setSetting('pasteDropMode', val)
}

// ── 压缩质量 ──
const compressQuality = ref(getSetting<number>('compressQuality'))

function saveCompressQuality(val: number) {
  compressQuality.value = val
  setSetting('compressQuality', val)
}

async function handleTestConnection() {
  if (!githubRepo.value || !githubToken.value) return
  githubTesting.value = true
  githubTestResult.value = ''
  githubTestError.value = ''
  try {
    await testConnection({
      repo: githubRepo.value,
      token: githubToken.value,
      branch: githubBranch.value || 'main',
    })
    githubTestResult.value = 'ok'
  } catch (e: any) {
    githubTestResult.value = 'fail'
    githubTestError.value = e.message || '连接失败'
  }
  githubTesting.value = false
}

const currentZoom = ref(getSetting<number>('pageZoom'))

const updateChecking = ref(false)
const updateMessage = ref('')
const updateError = ref(false)

const updateDialogVisible = ref(false)
const updateDialogVersion = ref('')
const pendingUpdate = ref<UpdateInfo | null>(null)
const pendingRid = ref<number | null>(null)
const downloading = ref(false)
const downloadProgress = ref(0)

async function applyZoom(scale: number) {
  currentZoom.value = scale
  setSetting('pageZoom', scale)
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

  // 复用 EditorPage 自动检查的结果（同一个 rid），避免创建重复 Update 资源
  if (autoUpdatePending.value && autoUpdateRid.value != null) {
    pendingUpdate.value = autoUpdatePending.value
    pendingRid.value = autoUpdateRid.value
    updateDialogVersion.value = autoUpdatePending.value.version
    updateDialogVisible.value = true
    updateChecking.value = false
    return
  }

  const result = await checkForUpdates()

  if (result.error) {
    updateMessage.value = result.error
    updateError.value = true
  } else if (result.update) {
    pendingUpdate.value = result.update
    pendingRid.value = result.rid
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
  if (!pendingUpdate.value || pendingRid.value == null) return

  downloading.value = true
  downloadProgress.value = 0

  try {
    let total = 0
    let totalSize = 0
    await downloadUpdateWithRid(pendingRid.value, (event) => {
      if (event.event === 'Started') {
        totalSize = event.data?.contentLength ?? 0
      } else if (event.event === 'Progress') {
        total += event.data?.chunkLength ?? 0
        if (totalSize > 0) {
          downloadProgress.value = Math.round((total / totalSize) * 100)
        }
      }
    })
    // downloadAndInstall 成功后自动重启；dev 模式下重启不生效，提示手动重启
    updateMessage.value = '更新已下载，请重启应用以完成安装'
    updateError.value = false
    downloading.value = false
  } catch (e) {
    console.error('[updater] download error:', e, typeof e, JSON.stringify(e))
    updateMessage.value = `安装失败: ${e}`
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
    :accent="colors.accent"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex gap-1">
        <button
          v-if="isTauri"
          class="cursor-pointer whitespace-nowrap rounded-full border-0 px-3 py-[5px] text-xs transition-colors"
          :class="settingsTab === 'basic'
            ? 'bg-[var(--accent)] text-white'
            : 'bg-transparent text-[#999] hover:text-[#333] dark:hover:text-[#ccc]'"
          @click="settingsTab = 'basic'"
        >
          基础设置
        </button>
        <button
          class="cursor-pointer whitespace-nowrap rounded-full border-0 px-3 py-[5px] text-xs transition-colors"
          :class="settingsTab === 'github'
            ? 'bg-[var(--accent)] text-white'
            : 'bg-transparent text-[#999] hover:text-[#333] dark:hover:text-[#ccc]'"
          @click="settingsTab = 'github'"
        >
          图床设置
        </button>
      </div>
    </template>

    <!-- 基础设置 -->
    <template v-if="settingsTab === 'basic'">
      <!-- 页面缩放（仅桌面端） -->
      <section v-if="isTauri">
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

      <!-- 自动保存（仅桌面端） -->
      <section v-if="isTauri" class="mt-6 pt-6 border-t border-[#f0f0f0] dark:border-[#333]">
        <h3 class="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] mb-3">
          自动保存
        </h3>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[12px] text-[#666] dark:text-[#999]">启用自动保存</span>
          <button
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
            :class="autoSaveEnabled ? 'bg-[var(--accent)]' : 'bg-[#ccc] dark:bg-[#555]'"
            @click="autoSaveEnabled = !autoSaveEnabled"
            role="switch"
            :aria-checked="autoSaveEnabled"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              :class="autoSaveEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'"
            />
          </button>
        </div>
        <p
          v-if="!autoSaveEnabled"
          class="text-[12px] text-[var(--accent)] bg-[var(--accent-light)] rounded-lg px-3 py-2 mb-3"
        >
          自动保存已关闭，请及时手动保存（工具栏「暂存」按钮）
        </p>
        <div>
          <span class="text-[12px] text-[#666] dark:text-[#999] mb-2 block"
            :class="{ 'opacity-40': !autoSaveEnabled }"
          >保存间隔</span>
          <div class="flex flex-nowrap gap-2">
            <button
              v-for="s in SAVE_INTERVAL_PRESETS"
              :key="s"
              :disabled="!autoSaveEnabled"
              class="cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-150 shrink-0 disabled:cursor-not-allowed disabled:opacity-30"
              :class="autoSaveInterval === s
                ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                : 'border-[#e5e5e5] bg-white text-[#666] hover:border-[#ccc] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999] dark:hover:border-[#666]'"
              @click="autoSaveInterval = s"
            >
              {{ s }}s
            </button>
          </div>
          <p class="text-[11px] text-[#999] dark:text-[#666] mt-2.5">
            当前间隔：{{ autoSaveInterval }}s（停止输入后触发保存）
          </p>
        </div>
      </section>

      <!-- 检查更新（仅桌面端） -->
      <section v-if="isTauri" class="mt-6 pt-6 border-t border-[#f0f0f0] dark:border-[#333]">
        <h3 class="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] mb-3">
          版本更新
        </h3>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[12px] text-[#666] dark:text-[#999]">启动时自动检查更新</span>
          <button
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
            :class="autoUpdateEnabled ? 'bg-[var(--accent)]' : 'bg-[#ccc] dark:bg-[#555]'"
            @click="autoUpdateEnabled = !autoUpdateEnabled"
            role="switch"
            :aria-checked="autoUpdateEnabled"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              :class="autoUpdateEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'"
            />
          </button>
        </div>
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
    </template>

    <!-- 图床设置 -->
    <template v-if="settingsTab === 'github'">
      <section>
        <h3 class="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] mb-3">
          GitHub 图床
        </h3>
        <p class="text-[11px] text-[#999] dark:text-[#666] mb-3">
          图片通过 GitHub API 上传后，使用 jsDelivr CDN 返回链接。
          需要公共仓库 + Personal Access Token（repo 权限）。
        </p>
        <!-- 仓库 -->
        <div class="mb-3">
          <label class="text-[12px] text-[#666] dark:text-[#999] mb-1.5 block">仓库</label>
          <input
            :value="githubRepo"
            placeholder="用户名/仓库名"
            class="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#ccc] focus:border-[var(--accent)] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#e5e5e5] dark:placeholder:text-[#555]"
            @input="saveGitHubRepo(($event.target as HTMLInputElement).value)"
          />
        </div>
        <!-- Token -->
        <div class="mb-3">
          <label class="text-[12px] text-[#666] dark:text-[#999] mb-1.5 block">Personal Access Token</label>
          <input
            :value="githubToken"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            class="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#ccc] focus:border-[var(--accent)] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#e5e5e5] dark:placeholder:text-[#555]"
            @input="saveGitHubToken(($event.target as HTMLInputElement).value)"
          />
        </div>
        <!-- 分支 -->
        <div class="mb-3">
          <label class="text-[12px] text-[#666] dark:text-[#999] mb-1.5 block">分支</label>
          <input
            :value="githubBranch"
            placeholder="main"
            class="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#ccc] focus:border-[var(--accent)] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#e5e5e5] dark:placeholder:text-[#555]"
            @input="saveGitHubBranch(($event.target as HTMLInputElement).value)"
          />
        </div>
        <!-- 测试连接 -->
        <div class="flex items-center gap-3">
          <button
            class="cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-4 py-1.5 text-[12px] font-medium text-[#666] transition-colors hover:border-[#ccc] hover:bg-[#f5f5f5] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999] dark:hover:border-[#666] dark:hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!githubRepo || !githubToken || githubTesting"
            @click="handleTestConnection"
          >
            {{ githubTesting ? '测试中…' : '测试连接' }}
          </button>
          <span
            v-if="githubTestResult === 'ok'"
            class="text-[12px]"
            :style="{ color: colors.accent }"
          >连接成功</span>
          <span
            v-if="githubTestResult === 'fail'"
            class="text-[12px] text-[#e74c3c]"
          >连接失败</span>
        </div>

        <!-- 上传方式 -->
        <div class="mt-4 pt-3 border-t border-[#eee] dark:border-[#444]">
          <label class="text-[12px] text-[#666] dark:text-[#999] mb-2 block">{{ isTauri ? '粘贴上传方式' : '粘贴/拖拽上传方式' }}</label>
          <div class="flex gap-2">
            <label
              class="cursor-pointer rounded-lg border px-4 py-2 text-center text-[12px] transition-colors min-w-[110px]"
              :class="pasteDropMode === 'local' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[#e5e5e5] bg-white text-[#666] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999]'"
            >
              <input type="radio" class="sr-only" value="local" :checked="pasteDropMode === 'local'" @change="savePasteDropMode('local')" />
              本地存储
            </label>
            <label
              class="cursor-pointer rounded-lg border px-4 py-2 text-center text-[12px] transition-colors min-w-[110px]"
              :class="pasteDropMode === 'github' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[#e5e5e5] bg-white text-[#666] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999]'"
            >
              <input type="radio" class="sr-only" value="github" :checked="pasteDropMode === 'github'" @change="savePasteDropMode('github')" />
              GitHub 图床
            </label>
          </div>
          <p class="text-[10px] text-[#999] dark:text-[#666] mt-1.5">
            本地存储：图片以 base64 编码嵌入文档（单张 ≤1000KB），建议开启压缩以减少文档体积<br />
            GitHub 图床：上传至仓库后使用 CDN 链接（单张 ≤5MB）
          </p>
        </div>

        <!-- 压缩质量 -->
        <div class="mt-3">
          <div class="flex items-center justify-between mb-1">
            <label class="text-[12px] text-[#666] dark:text-[#999]">压缩质量</label>
            <span class="text-[12px] font-medium tabular-nums text-[var(--accent)]">{{ compressQuality }}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            :value="compressQuality"
            class="compress-slider w-full cursor-pointer"
            @input="saveCompressQuality(Number(($event.target as HTMLInputElement).value))"
          />
          <div class="flex justify-between text-[10px] text-[#999] dark:text-[#666] mt-0.5">
            <span>低（小体积）</span>
            <span>高（高画质）</span>
          </div>
          <p class="text-[10px] text-[#999] dark:text-[#666] mt-1.5">
            对应 JPEG 压缩质量，值越高图片越清晰，体积越大。
          </p>
          <p class="text-[10px] text-[#999] dark:text-[#666] mt-0.5">
            压缩后图片将统一转为 JPEG 格式
          </p>
        </div>
      </section>
    </template>

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

<style scoped>
.compress-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  outline: none;
  accent-color: var(--accent);
}

:global(.dark) .compress-slider {
  background: #444;
}

.compress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
}

.compress-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
}

.compress-slider::-moz-range-track {
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
}
</style>
