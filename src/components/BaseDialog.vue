<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  visible: boolean
  title?: string
  width?: string
  maxHeight?: string
  showFooter?: boolean
  confirmText?: string
  cancelText?: string
  confirmDisabled?: boolean
  accent?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

let lockCount = 0

watch(() => props.visible, (v) => {
  if (v) {
    lockCount++
    document.body.style.overflow = 'hidden'
  } else {
    lockCount--
    if (lockCount <= 0) {
      lockCount = 0
      document.body.style.overflow = ''
    }
  }
})

onBeforeUnmount(() => {
  if (props.visible) {
    lockCount--
    if (lockCount <= 0) {
      lockCount = 0
      document.body.style.overflow = ''
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-base-dialog-fade-in"
      @mousedown.self="emit('close')"
    >
      <div
        class="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:bg-[#1a1a1a] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-base-dialog-slide-up"
        :style="{ width: width || 'min(90vw, 720px)', maxHeight: maxHeight || '85vh' }"
        @mousedown.stop
        @click.stop
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center gap-3 border-b border-[#f0f0f0] px-5 py-3.5 dark:border-[#333]">
          <span class="text-base font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] shrink-0">{{ title }}</span>
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <slot name="header" />
          </div>
          <button
            class="flex shrink-0 size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#999] transition-colors hover:bg-[#f5f5f5] hover:text-[#333] dark:hover:bg-[#333] dark:hover:text-[#ccc]"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto bg-[#f5f5f5] p-5 dark:bg-[#121212] scrollbar-thin">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="showFooter"
          class="flex shrink-0 justify-end gap-3 border-t border-[#f0f0f0] px-5 py-3 dark:border-[#333]"
        >
          <slot name="footer">
            <button
              class="cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-5 py-2 text-[13px] text-[#666] transition-colors hover:bg-[#f5f5f5] dark:border-[#444] dark:bg-[#2a2a2a] dark:text-[#999] dark:hover:bg-[#333]"
              @click="emit('close')"
            >
              {{ cancelText || '取消' }}
            </button>
            <button
              class="cursor-pointer rounded-lg border-0 px-5 py-2 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              :style="accent ? { backgroundColor: accent } : { backgroundColor: '#07C160' }"
              :disabled="confirmDisabled"
              @click="emit('confirm')"
            >
              {{ confirmText || '确认' }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes base-dialog-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes base-dialog-slide-up {
  from { transform: translateY(12px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.animate-base-dialog-fade-in {
  animation: base-dialog-fade-in 0.2s ease-out;
}
.animate-base-dialog-slide-up {
  animation: base-dialog-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}

.dark .scrollbar-thin {
  scrollbar-color: #444 transparent;
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #444;
}
</style>
