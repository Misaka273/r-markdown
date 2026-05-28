<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useDropdownGroup } from '../composables/useDropdownGroup'

const props = defineProps<{
  mode?: 'editor' | 'preview'
}>()

const emit = defineEmits<{
  'load-demo': []
  'download-demo': []
  'copy-html': []
  'save-image': []
  'copy-rich-text': []
  'go-components': []
}>()

const { toggle: groupToggle, isVisible } = useDropdownGroup('actions')

function toggle() {
  groupToggle(!isVisible.value)
}

function handleAction(action: () => void) {
  action()
  groupToggle(false)
}

function close(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.mobile-actions-menu')) {
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
  <div class="mobile-actions-menu relative sm:hidden">
    <button
      class="w-7 h-7 rounded-full border-2 border-white/30 cursor-pointer flex items-center justify-center p-0 shrink-0 transition-all duration-200 hover:scale-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] bg-[#2d3436] text-white"
      title="操作菜单"
      @click.stop="toggle"
    >
      <!-- 三点菜单图标 -->
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="5" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </svg>
    </button>
    <div
      class="mobile-actions-dropdown absolute top-full right-0 mt-2 p-1.5 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 w-44"
      :class="{ show: isVisible }"
    >
            <!-- 编辑模式：扩展组件 + AI排版示例 + 下载示例 + 加载示例 -->
      <template v-if="mode === 'editor'">
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('go-components'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          扩展组件
        </button>
        <a
          href="https://chat.deepseek.com/share/eq2bpaxrcrjbye1hc4"
          target="_blank"
          rel="noopener noreferrer"
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5 no-underline"
          @click="handleAction(() => {})"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
            />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
          </svg>
          AI排版示例
        </a>
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('download-demo'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          下载示例
        </button>
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('load-demo'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          加载示例
        </button>
      </template>
      <!-- 预览模式：显示其他三个 -->
      <template v-else>
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('copy-html'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          复制 HTML
        </button>
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('save-image'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          保存图片
        </button>
        <button
          class="mobile-action-option w-full flex items-center gap-2 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[13px] text-black/80 transition-colors duration-150 hover:bg-black/5"
          @click="handleAction(() => emit('copy-rich-text'))"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          复制富文本
        </button>
        <div class="px-4 pb-1 text-[10px] opacity-40 leading-tight">
          移动端复制富文本会丢失样式，推荐在PC端操作
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mobile-actions-dropdown {
  display: none;
}

.mobile-actions-dropdown.show {
  display: block;
}
</style>

<style>
/* Dark mode overrides */
[data-theme='dark'] .mobile-actions-dropdown {
  background: #2a2a2e !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}
[data-theme='dark'] .mobile-action-option {
  color: #ccc !important;
}
[data-theme='dark'] .mobile-action-option:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>
