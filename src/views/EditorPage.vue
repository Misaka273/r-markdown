<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useDarkMode } from '../composables/useDarkMode'
import { DEMO_CONTENT } from '../data/demoContent'
import Editor from '../components/Editor.vue'
import Preview from '../components/Preview.vue'
import ThemePicker from '../components/ThemePicker.vue'
import DarkModeToggle from '../components/DarkModeToggle.vue'
import MobileActionsMenu from '../components/MobileActionsMenu.vue'

const { accent, colors, setTheme, setCustomTheme, customColor, themes } = useTheme()
const { mode: darkMode, isDark, setMode: setDarkMode } = useDarkMode()

// ── 移动端 Tab 切换 ──
const mobileTab = ref<'editor' | 'preview'>('editor')
const isMobile = ref(window.innerWidth < 768)
const nearBottom = ref(false)

function onResize() {
  isMobile.value = window.innerWidth < 768
}

// 编辑器滚动：同步预览 + 检测是否接近底部
function onEditorScrollAll(ratio: number) {
  handleEditorScroll(ratio)
  if (isMobile.value) {
    nearBottom.value = ratio > 0.85
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

// ── 拖动调整宽度 ──
const previewWidth = ref(450)
const isDragging = ref(false)
let startX = 0
let startWidth = 0

function onDragStart(e: MouseEvent) {
  isDragging.value = true
  startX = e.clientX
  startWidth = previewWidth.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onDragMove(e: MouseEvent) {
  const delta = startX - e.clientX
  const minW = 407
  const maxW = 750
  const newWidth = Math.min(Math.max(startWidth + delta, minW), maxW)
  previewWidth.value = newWidth
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const STORAGE_KEY = 'wechat-md-editor-content'
const SAVE_TIME_KEY = 'wechat-md-editor-save-time'

const saved = localStorage.getItem(STORAGE_KEY)
const markdown = ref(saved !== null ? saved : DEMO_CONTENT)
const previewRef = ref()
const savedTime = localStorage.getItem(SAVE_TIME_KEY)
const saveHint = ref(savedTime ? '已保存 ' + savedTime : '')

let saveTimer: ReturnType<typeof setTimeout> | null = null
function onInput(value: string) {
  markdown.value = value
  saveHint.value = '输入中…'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, value)
    const now = new Date()
    const timeStr =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0')
    localStorage.setItem(SAVE_TIME_KEY, timeStr)
    saveHint.value = '已保存 ' + timeStr
  }, 500)
}

function loadDemo() {
  markdown.value = DEMO_CONTENT
  localStorage.setItem(STORAGE_KEY, DEMO_CONTENT)
  const now = new Date()
  const timeStr =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0') +
    ' ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0') +
    ':' +
    String(now.getSeconds()).padStart(2, '0')
  localStorage.setItem(SAVE_TIME_KEY, timeStr)
  saveHint.value = '已保存 ' + timeStr
}

function handleCopyRichText() {
  previewRef.value?.copyRichText()
}

function handleCopyHTML() {
  previewRef.value?.copyHTML()
}

function handleSaveImage() {
  previewRef.value?.saveAsImage()
}

// 滚动同步
let pendingRatio: number | null = null
let syncSource: 'editor' | 'preview' | null = null
let rafId = 0
let isFlushing = false

function flushSync() {
  rafId = 0
  if (pendingRatio === null || syncSource === null) return
  const ratio = pendingRatio
  const src = syncSource
  pendingRatio = null
  syncSource = null

  isFlushing = true
  if (src === 'editor') {
    const previewScroll = document.querySelector('.preview-scroll') as HTMLElement
    if (previewScroll) {
      const maxScroll = previewScroll.scrollHeight - previewScroll.clientHeight
      const target = ratio * maxScroll
      if (Math.abs(previewScroll.scrollTop - target) > 1) {
        previewScroll.scrollTop = target
      }
    }
  } else {
    const scroller = document.querySelector('.cm-scroller') as HTMLElement
    if (scroller) {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight
      const target = ratio * maxScroll
      if (Math.abs(scroller.scrollTop - target) > 1) {
        scroller.scrollTop = target
      }
    }
  }
  isFlushing = false
}

function scheduleSync() {
  if (!rafId) rafId = requestAnimationFrame(flushSync)
}

function handleEditorScroll(ratio: number) {
  if (isFlushing) return
  if (isMobile.value && mobileTab.value !== 'editor') return
  syncSource = 'editor'
  pendingRatio = ratio
  scheduleSync()
}

function handlePreviewScroll(ratio: number) {
  if (isFlushing) return
  syncSource = 'preview'
  pendingRatio = ratio
  scheduleSync()
}

let previewScrollEl: HTMLElement | null = null
function onPreviewScroll() {
  if (isFlushing) return
  if (!previewScrollEl) previewScrollEl = document.querySelector('.preview-scroll')
  if (!previewScrollEl) return
  const maxScroll = previewScrollEl.scrollHeight - previewScrollEl.clientHeight
  if (maxScroll > 0) {
    const ratio = previewScrollEl.scrollTop / maxScroll
    handlePreviewScroll(ratio)
    if (isMobile.value) {
      nearBottom.value = ratio > 0.85
    }
  }
}

onMounted(() => {
  previewScrollEl = document.querySelector('.preview-scroll')
  previewScrollEl?.addEventListener('scroll', onPreviewScroll, { passive: true })
})
onBeforeUnmount(() => {
  previewScrollEl?.removeEventListener('scroll', onPreviewScroll)
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Toolbar -->
    <div class="toolbar flex items-center justify-between px-4 py-2 border-b shrink-0">
      <div class="flex items-center min-w-0">
        <router-link
          to="/"
          class="flex items-center text-sm font-semibold tracking-tight no-underline"
          style="color: var(--text-primary)"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" class="shrink-0 mr-1.5">
            <rect width="24" height="24" rx="5" :fill="accent" />
            <text
              x="2.5"
              y="17.5"
              font-family="Arial, sans-serif"
              font-size="12"
              font-weight="bold"
              fill="white"
            >
              RM
            </text>
          </svg>
          <span class="hidden sm:inline">R-Markdown 编辑器</span>
          <span class="sm:hidden">R-Markdown</span>
          <span class="text-[0.55em] opacity-60 align-super ml-0.5 hidden sm:inline"
            >for 公众号</span
          >
        </router-link>
        <span class="sm:hidden text-[11px] opacity-50 ml-2 shrink-0">{{ saveHint }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- 桌面端：显示所有按钮 -->
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
          @click="$router.push('/components')"
        >
          <svg
            class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          扩展组件
        </button>
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
          @click="loadDemo"
        >
          <svg
            class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          加载示例
        </button>
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
          @click="handleCopyHTML"
        >
          <svg
            class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          复制 HTML
        </button>
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
          @click="handleSaveImage"
        >
          <svg
            class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          保存图片
        </button>
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] active:scale-[0.97]"
          @click="handleCopyRichText"
        >
          <svg
            class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          复制富文本
        </button>
        <!-- 移动端：下拉菜单 -->
        <MobileActionsMenu
          :mode="mobileTab"
          @load-demo="loadDemo"
          @copy-html="handleCopyHTML"
          @save-image="handleSaveImage"
          @copy-rich-text="handleCopyRichText"
          @go-components="$router.push('/components')"
        />
        <ThemePicker
          :themes="themes"
          :current-accent="accent"
          :custom-color="customColor"
          @select="setTheme"
          @custom-select="setCustomTheme"
        />
        <DarkModeToggle :mode="darkMode" @select="setDarkMode" />
      </div>
    </div>

    <!-- Main Layout -->
    <!-- 移动端：底部悬浮胶囊 Tab（始终显示） -->
    <div
      class="mobile-tab-bar md:hidden"
      :style="{
        '--accent': accent,
        '--pill-bg': isDark ? 'rgba(30, 30, 30, 0.45)' : 'rgba(245, 245, 247, 0.45)',
        '--pill-shadow': isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        '--pill-shadow-sm': isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        '--pill-inset': isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.4)',
        '--pill-text': isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
      }"
    >
      <div class="mobile-tab-pill">
        <div class="mobile-tab-highlight" :class="mobileTab === 'preview' ? 'right' : 'left'"></div>
        <button
          class="mobile-tab-btn"
          :class="{ active: mobileTab === 'editor' }"
          @click="mobileTab = 'editor'"
        >
          <svg
            class="w-4 h-4 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          编辑
        </button>
        <button
          class="mobile-tab-btn"
          :class="{ active: mobileTab === 'preview' }"
          @click="mobileTab = 'preview'"
        >
          <svg
            class="w-4 h-4 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            viewBox="0 0 24 24"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="2.5" />
          </svg>
          预览
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Editor Panel -->
      <div
        class="flex flex-col overflow-hidden flex-1 min-w-0"
        :class="{
          'hidden md:flex': mobileTab !== 'editor',
          'mobile-near-bottom': nearBottom && isMobile,
        }"
      >
        <div
          class="panel-header hidden md:flex items-center justify-between px-4 py-2 border-b text-xs font-semibold shrink-0"
        >
          <span class="flex items-center gap-1.5">
            <svg
              class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
              viewBox="0 0 24 24"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Markdown 编辑
          </span>
          <span class="panel-header-muted font-normal text-[11px]">{{ saveHint }}</span>
        </div>
        <Editor :model-value="markdown" @update:model-value="onInput" @scroll="onEditorScrollAll" />
      </div>

      <!-- Resize Handle (仅桌面端) -->
      <div class="resize-handle hidden md:block" @mousedown="onDragStart"></div>

      <!-- Preview Panel -->
      <div
        class="flex flex-col overflow-hidden flex-1 md:flex-none"
        :class="{
          'hidden md:flex': mobileTab !== 'preview',
          'mobile-near-bottom': nearBottom && isMobile,
        }"
        :style="isMobile ? {} : { width: previewWidth + 'px' }"
      >
        <div
          class="panel-header hidden md:flex items-center justify-between px-4 py-2 border-b text-xs font-semibold shrink-0"
        >
          <span class="flex items-center gap-1.5">
            <svg
              class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
              viewBox="0 0 24 24"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="2.5" />
            </svg>
            公众号预览
          </span>
          <span class="panel-header-muted font-normal text-[11px]"
            >实时渲染 · 可直接复制到公众号</span
          >
        </div>
        <Preview ref="previewRef" :markdown="markdown" :colors="colors" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移动端底部悬浮胶囊 */
.mobile-tab-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
}

.mobile-tab-pill {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 9999px;
  background: var(--pill-bg, rgba(245, 245, 247, 0.45));
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  box-shadow:
    0 4px 24px var(--pill-shadow, rgba(0, 0, 0, 0.08)),
    0 1px 4px var(--pill-shadow-sm, rgba(0, 0, 0, 0.05)),
    inset 0 1px 0 var(--pill-inset, rgba(255, 255, 255, 0.4));
  pointer-events: auto;
}

.mobile-tab-highlight {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  border-radius: 9999px;
  background: var(--accent, #6c5ce7);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mobile-tab-highlight.left {
  transform: translateX(0);
}

.mobile-tab-highlight.right {
  transform: translateX(100%);
}

.mobile-tab-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--pill-text, rgba(0, 0, 0, 0.45));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.25s ease;
  white-space: nowrap;
  line-height: 1;
}

.mobile-tab-btn.active {
  color: #fff;
}

/* 暗色模式 - 按钮文字颜色（通过 CSS 变量处理，见 :style 绑定） */

/* 滚动到底部附近时，给内容区域加底部 padding 避免被胶囊遮挡 */
@media (max-width: 767px) {
  .mobile-near-bottom :deep(.cm-editor) {
    padding-bottom: 80px;
  }
  .mobile-near-bottom :deep(.preview-scroll) {
    padding-bottom: 80px;
  }
}
</style>
