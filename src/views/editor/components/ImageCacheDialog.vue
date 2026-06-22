<template>
  <BaseDialog
    :visible="visible"
    :title="titleText"
    width="min(90vw, 840px)"
    :show-footer="multiSelect && selectedTokens.size > 0"
    :accent="colors.accent"
    @close="emit('close')"
  >
    <template #header>
      <div class="ml-auto flex items-center gap-1">
        <button
          v-if="multiSelect"
          class="flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#333]"
          :class="allSelected ? 'text-[var(--accent)]' : 'text-[#999]'"
          @click="toggleSelectAll"
          title="全选"
        >
          <CheckCheck :size="16" />
        </button>
        <button
          class="flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#333]"
          :class="multiSelect ? 'text-[var(--accent)]' : 'text-[#999]'"
          @click="toggleMultiSelect"
          :title="multiSelect ? '退出多选' : '多选'"
        >
          <ListChecks :size="16" />
        </button>
      </div>
    </template>

    <div v-if="loading" class="py-10 text-center text-sm text-[#999] dark:text-[#666]">加载中...</div>
    <div v-else-if="images.length === 0" class="py-10 text-center text-sm text-[#999] dark:text-[#666]">暂无缓存图片</div>
    <div v-else class="relative grid grid-cols-5 gap-3">
      <div
        v-for="img in images"
        :key="img.token"
        class="relative aspect-square cursor-default overflow-hidden rounded-lg border-2 bg-white transition-colors dark:bg-[#2a2a2a]"
        :class="multiSelect
          ? (selectedTokens.has(img.token)
            ? 'cursor-pointer border-[var(--accent)]'
            : 'cursor-pointer border-transparent hover:border-[#e0e0e0] dark:hover:border-[#555]')
          : 'border-transparent hover:border-[#e0e0e0] dark:hover:border-[#555]'"
        @click="multiSelect && toggleSelect(img.token)"
      >
        <img :src="img.dataUrl" class="block h-full w-full object-cover" />
        <div
          v-if="multiSelect"
          class="absolute left-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded border-2 border-[#d9d9d9] bg-white/90 dark:border-[#555] dark:bg-[#2a2a2a]/90"
          :class="{ '!border-[var(--accent)] !bg-[var(--accent)]': selectedTokens.has(img.token) }"
        >
          <span v-if="selectedTokens.has(img.token)" class="text-[13px] font-bold text-white">✓</span>
        </div>
        <button
          v-if="!multiSelect"
          class="absolute bottom-1.5 right-1.5 cursor-pointer rounded border-0 bg-black/55 px-2.5 py-[3px] text-xs text-white opacity-0 transition-opacity hover:bg-red-600/80"
          @click.stop="confirmDelete(img.token)"
        >
          清理
        </button>
      </div>

      <!-- 确认弹窗 -->
      <div
        v-if="confirmVisible"
        class="absolute inset-0 z-10 flex items-center justify-center bg-[#f5f5f5]/80 dark:bg-[#121212]/80"
      >
        <div class="rounded-[10px] bg-white p-6 shadow-lg dark:bg-[#2a2a2a]">
          <p class="mb-5 text-sm text-[#333] dark:text-[#e5e5e5]">{{ confirmMessage }}</p>
          <div class="flex justify-end gap-2.5">
            <button
              class="cursor-pointer rounded-md border border-[#d9d9d9] bg-white px-[18px] py-1.5 text-[13px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-[#555] dark:bg-[#333] dark:text-[#ccc] dark:hover:border-[var(--accent)]"
              @click="confirmVisible = false"
            >取消</button>
            <button
              class="cursor-pointer rounded-md border-0 bg-[#dc2626] px-[18px] py-1.5 text-[13px] text-white transition-colors hover:bg-[#b91c1c]"
              @click="handleConfirm"
            >确定</button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="cursor-pointer rounded-md border-0 bg-[#dc2626] px-5 py-[7px] text-[13px] text-white transition-colors hover:bg-[#b91c1c]"
        @click="confirmBatchDelete"
      >
        清理选中（{{ selectedTokens.size }}）
      </button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ListChecks, CheckCheck } from 'lucide-vue-next'
import BaseDialog from '@/components/BaseDialog.vue'
import { getAllImagePreviews, deleteImage } from '@/utils/imageDB'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { colors } = useTheme()

const loading = ref(true)
const images = ref<{ token: string; dataUrl: string }[]>([])
const multiSelect = ref(false)
const selectedTokens = ref(new Set<string>())

const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingTokens = ref<string[]>([])

const allSelected = computed(() =>
  images.value.length > 0 && selectedTokens.value.size === images.value.length,
)

const titleText = computed(() => '清理图片缓存')

async function loadImages() {
  loading.value = true
  images.value = await getAllImagePreviews()
  loading.value = false
}

function toggleMultiSelect() {
  multiSelect.value = !multiSelect.value
  if (!multiSelect.value) {
    selectedTokens.value.clear()
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedTokens.value.clear()
  } else {
    selectedTokens.value = new Set(images.value.map((img) => img.token))
  }
}

function toggleSelect(token: string) {
  const s = new Set(selectedTokens.value)
  if (s.has(token)) {
    s.delete(token)
  } else {
    s.add(token)
  }
  selectedTokens.value = s
}

function confirmDelete(token: string) {
  pendingTokens.value = [token]
  confirmMessage.value = '确定要清理这张图片缓存吗？'
  confirmVisible.value = true
}

function confirmBatchDelete() {
  pendingTokens.value = [...selectedTokens.value]
  confirmMessage.value = `确定要清理选中的 ${selectedTokens.value.size} 张图片缓存吗？`
  confirmVisible.value = true
}

async function handleConfirm() {
  for (const token of pendingTokens.value) {
    await deleteImage(token)
  }
  confirmVisible.value = false
  selectedTokens.value.clear()
  pendingTokens.value = []
  await loadImages()
}

loadImages()
</script>
