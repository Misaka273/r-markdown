<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSetting, setSetting } from '@/config/settings'
import {
  Component, Paperclip, FilePlus, Download, Bot, Import, Images,
  Sun, Moon, Monitor, Bolt, ChevronDown, ChevronUp, SquareBottomDashedScissors,
  HelpCircle
} from 'lucide-vue-next'

const isTauri = import.meta.env.VITE_TAURI === 'true'
const router = useRouter()
const helpHref = computed(() => isTauri ? 'https://r-markdown.pages.dev/#/help' : undefined)

function openHelp() {
  if (isTauri) {
    window.open('https://r-markdown.pages.dev/#/help', '_blank', 'noopener,noreferrer')
  } else {
    router.push('/help')
  }
}

const props = defineProps<{
  activeTab?: string
  darkMode?: string
  draftCount?: number
}>()

const emit = defineEmits<{
  (e: 'select', tab: string): void
  (e: 'toggleDarkMode'): void
  (e: 'openSettings'): void
  (e: 'openComponents'): void
  (e: 'openDrafts'): void
  (e: 'exampleAction', action: 'load' | 'download' | 'aiDemo'): void
  (e: 'openImport'): void
  (e: 'openGallery'): void
}>()

const showExamples = ref(false)
const examplesRef = ref<HTMLElement | null>(null)
const exampleBtnRef = ref<HTMLElement | null>(null)
const popoverPos = ref({ top: '0px', left: '0px' })

async function toggleExamples() {
  showExamples.value = !showExamples.value
  if (showExamples.value && exampleBtnRef.value) {
    await nextTick()
    const rect = exampleBtnRef.value.getBoundingClientRect()
    popoverPos.value = {
      top: rect.top + 'px',
      left: (rect.right + 4) + 'px',
    }
  }
}

function selectExample(action: 'load' | 'download' | 'aiDemo') {
  showExamples.value = false
  emit('exampleAction', action)
}

function onDocumentClick(e: MouseEvent) {
  if (showExamples.value && examplesRef.value && !examplesRef.value.contains(e.target as Node)) {
    showExamples.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

const collapsed = ref(getSetting<boolean>('sidebarCollapsed') ?? false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
  setSetting('sidebarCollapsed', collapsed.value)
}
</script>

<template>
  <div
    class="editor-sidebar flex flex-col shrink-0 transition-all duration-300"
    :class="collapsed ? 'fixed bottom-4 z-50 shadow-lg' : ''"
    :style="{
      width: collapsed ? 'auto' : '64px',
      height: collapsed ? 'auto' : '100%',
      marginRight: collapsed ? '0px' : '10px',
      left: collapsed ? '10px' : undefined,
      background: collapsed ? 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' : 'var(--bg-primary)',
      borderRadius: collapsed ? '20px' : '12px',
      overflow: collapsed ? 'hidden' : 'visible',
    }"
  >
    <!-- Top content: hidden when collapsed -->
    <div
      class="flex flex-col items-center gap-1 pt-2 pb-1 transition-all duration-300 space-y-2"
      :style="{
        maxHeight: collapsed ? '0px' : '200px',
        opacity: collapsed ? 0 : 1,
        overflow: collapsed ? 'hidden' : 'visible',
        paddingTop: collapsed ? '0px' : undefined,
        paddingBottom: collapsed ? '0px' : undefined,
      }"
    >
      <!-- 草稿列表 button -->
      <button
        class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150"
        title="草稿箱"
        @click="emit('openDrafts')"
      >
        <SquareBottomDashedScissors :size="24" class="shrink-0" />
        <span class="text-[10px] leading-tight">草稿</span>
        <span
          v-if="draftCount && draftCount > 0"
          class="min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-semibold text-white"
          :style="{ background: 'var(--accent)' }"
        >{{ draftCount > 99 ? '99+' : draftCount }}</span>
      </button>
      <!-- 导入 button -->
      <button
        class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150"
        title="导入文件"
        @click="emit('openImport')"
      >
        <Import :size="24" class="shrink-0" />
        <span class="text-[10px] leading-tight">导入</span>
      </button>
      <!-- 扩展组件 button -->
      <button
        class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150"
        title="扩展组件API"
        @click="emit('openComponents')"
      >
        <Component :size="24" class="shrink-0" />
        <span class="text-[10px] leading-tight">组件</span>
      </button>
      <!-- 图库 button -->
      <button
        class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150"
        title="图库"
        @click="emit('openGallery')"
      >
        <Images :size="24" class="shrink-0" />
        <span class="text-[10px] leading-tight">图库</span>
      </button>
      <!-- 示例 button with popover -->
      <div class="relative w-full">
        <button
          ref="exampleBtnRef"
          class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150"
          title="示例"
          @click.stop="toggleExamples"
        >
          <Paperclip :size="24" class="shrink-0" />
          <span class="text-[10px] leading-tight">示例</span>
        </button>
        <!-- Examples popover -->
        <div
          v-if="showExamples"
          ref="examplesRef"
          class="examples-popover fixed rounded-xl z-50 p-1.5 min-w-[120px]"
          :style="{ background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', top: popoverPos.top, left: popoverPos.left }"
        >
          <button
            class="examples-item flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] border-none bg-transparent cursor-pointer text-black/80 transition-colors duration-150 hover:bg-black/5"
            @click="selectExample('load')"
          >
            <FilePlus :size="14" class="shrink-0" />
            加载示例
          </button>
          <button
            class="examples-item flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] border-none bg-transparent cursor-pointer text-black/80 transition-colors duration-150 hover:bg-black/5"
            @click="selectExample('download')"
          >
            <Download :size="14" class="shrink-0" />
            下载示例
          </button>
          <button
            class="examples-item flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] border-none bg-transparent cursor-pointer text-black/80 transition-colors duration-150 hover:bg-black/5"
            @click="selectExample('aiDemo')"
          >
            <Bot :size="14" class="shrink-0" />
            AI排版示例
          </button>
        </div>
      </div>
      <!-- 帮助 button -->
      <a
        :href="helpHref"
        :target="isTauri ? '_blank' : undefined"
        class="sidebar-top-btn flex flex-col items-center gap-0.5 w-full py-2 rounded-lg border-none cursor-pointer transition-colors duration-150 no-underline"
        title="使用帮助"
        @click.prevent="openHelp"
      >
        <HelpCircle :size="24" class="shrink-0" />
        <span class="text-[10px] leading-tight">帮助</span>
      </a>
    </div>

    <!-- Bottom buttons: dark mode / settings / collapse — always visible -->
    <div
      class="flex items-center gap-1 space-y-1"
      :class="collapsed ? 'flex-col px-1 py-1.5' : 'flex-col pb-2 mt-auto'"
    >
      <button
        class="sidebar-bottom-btn flex items-center justify-center w-8 h-8 cursor-pointer transition-all duration-200 hover:scale-110"
        :class="collapsed ? 'rounded-full' : 'rounded-lg'"
        :title="darkMode === 'dark' ? '切换跟随系统' : darkMode === 'system' ? '切换浅色模式' : '切换深色模式'"
        @click="emit('toggleDarkMode')"
      >
        <Sun v-if="darkMode === 'dark'" :size="20" />
        <Monitor v-else-if="darkMode === 'system'" :size="20" />
        <Moon v-else :size="20" />
      </button>
      <button
        class="sidebar-bottom-btn flex items-center justify-center w-8 h-8 cursor-pointer transition-all duration-200 hover:scale-110"
        :class="collapsed ? 'rounded-full' : 'rounded-lg'"
        title="编辑器设置"
        @click="emit('openSettings')"
      >
        <Bolt :size="20" />
      </button>

      <!-- Collapse / Expand button -->
      <button
        class="flex items-center justify-center w-8 h-8 border-none cursor-pointer transition-colors duration-150"
        :class="collapsed ? 'rounded-full' : 'rounded-lg'"
        :style="{ background: `color-mix(in srgb, var(--accent) 10%, transparent)`, color: 'var(--accent)' }"
        :title="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="toggleCollapse"
      >
        <ChevronDown v-if="!collapsed" :size="20" />
        <ChevronUp v-else :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar-top-btn {
  color: var(--text-secondary);
}
.sidebar-top-btn:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.sidebar-bottom-btn {
  color: var(--text-secondary);
}
.sidebar-bottom-btn:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.sidebar-item:hover {
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}
.sidebar-item.active:hover {
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
</style>

<style>
[data-theme='dark'] .examples-popover {
  background: #2a2a2e !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}
[data-theme='dark'] .examples-item {
  color: #ccc !important;
}
[data-theme='dark'] .examples-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>
