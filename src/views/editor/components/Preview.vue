<script setup lang="ts">
import { ref, watch } from 'vue'
import { toPng } from 'html-to-image'
import type { ThemeColors } from '@/composables/useTheme'
import { useDarkMode } from '@/composables/useDarkMode'
import { parseMarkdownAsync } from '@/utils/markdownParser'
import Toast from '@/components/Toast.vue'

const { isDark } = useDarkMode()

const props = defineProps<{
  markdown: string
  colors: ThemeColors
  isMobile: boolean
}>()

const previewRef = ref<HTMLElement>()
const scrollContainerRef = ref<HTMLElement>()
const saving = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
const hintVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null
let hintTimer: ReturnType<typeof setTimeout> | null = null
let scrollDebounce: ReturnType<typeof setTimeout> | null = null

function onScroll() {
  if (!isDark.value) return
  hintVisible.value = false
  if (scrollDebounce) clearTimeout(scrollDebounce)
  scrollDebounce = setTimeout(() => {
    hintVisible.value = true
    if (hintTimer) clearTimeout(hintTimer)
    hintTimer = setTimeout(() => {
      hintVisible.value = false
    }, 5000)
  }, 300)
}

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 1500)
}

async function updateContent() {
  const el = previewRef.value
  if (!el) return
  el.innerHTML = await parseMarkdownAsync(props.markdown, props.colors)
}

watch(
  () => props.markdown,
  () => updateContent(),
)
watch(
  () => props.colors,
  () => updateContent(),
  { deep: true },
)
watch(previewRef, () => updateContent())

function copyRichText() {
  const el = previewRef.value
  if (!el) return
  const html = `<section style="background-color:#fff;color:#333;padding:0">${el.innerHTML}</section>`
  const blob = new Blob([html], { type: 'text/html' })
  const item = new ClipboardItem({
    'text/html': blob,
    'text/plain': new Blob([el.innerText], { type: 'text/plain; charset=utf-8' }),
  })
  navigator.clipboard
    .write([item])
    .then(() => {
      showToast('已复制富文本，可直接粘贴到公众号后台')
    })
    .catch(() => {
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      tmp.style.position = 'fixed'
      tmp.style.left = '-9999px'
      document.body.appendChild(tmp)
      const range = document.createRange()
      range.selectNodeContents(tmp)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      document.execCommand('copy')
      sel?.removeAllRanges()
      document.body.removeChild(tmp)
      showToast('已复制富文本（降级模式）')
    })
}

function copyHTML() {
  const el = previewRef.value
  if (!el) return
  navigator.clipboard
    .writeText(el.innerHTML)
    .then(() => {
      showToast('已复制 HTML 源码（全部内联样式）')
    })
    .catch(() => {
      const ta = document.createElement('textarea')
      ta.value = el.innerHTML
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast('已复制 HTML 源码')
    })
}

async function saveAsImage() {
  const el = previewRef.value
  if (!el || saving.value) return

  saving.value = true

  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: '#ffffff',
      // 文章里有加载不出来的图（404、本地相对路径被 dev server 当 index.html 返回、跨域等）时，
      // 用透明占位顶上、并跳过出错的图，而不是让整张导出失败抛出 [object Event]
      imagePlaceholder:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      onImageErrorHandler: (e: Event | string) => {
        if (typeof e === 'string') return
        const t = e.target as HTMLImageElement | null
        if (t && 'src' in t) {
          t.src =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      },
      style: {
        padding: '20px 16px 40px',
      },
      filter: (node: HTMLElement) => {
        if (
          node.classList &&
          (node.classList.contains('CodeMirror') || node.classList.contains('CodeMirror-line'))
        )
          return false
        return true
      },
    })

    const link = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    link.download = `公众号预览_${dateStr}.png`
    link.href = dataUrl
    link.click()
    showToast('图片已保存')
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof Event !== 'undefined' && err instanceof Event
          ? '渲染失败（可能有图片加载不出来）'
          : String(err)
    showToast('生成失败：' + msg)
  } finally {
    saving.value = false
  }
}

defineExpose({ copyRichText, copyHTML, saveAsImage })
</script>

<template>
  <div style="position:relative;height:100%;">
  <div
    ref="scrollContainerRef"
    class="preview-scroll"
    style="
      height: 100%;
      overflow-y: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    "
    @scroll="onScroll"
  >
    <div
      class="phone-frame"
      :style="{
        width: '100%',
        maxWidth: '700px',
        flexShrink: 0,
        background: 'transparent',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        margin: '0 auto',
      }"
    >
      <div
        ref="previewRef"
        style="
          padding: 18px;
          color: #333;
          font-size: 15px;
          line-height: 1.8;
          word-wrap: break-word;
          overflow-wrap: break-word;
          background-color: transparent;
        "
      ></div>
    </div>
  </div>
  <Transition name="hint-fade">
    <div
      v-show="hintVisible"
      :style="{
        position: 'absolute',
        top: isMobile ? '0' : undefined,
        bottom: isMobile ? undefined : '0',
        left: '0',
        right: '0',
        padding: '10px 16px',
        background: 'var(--bg-primary)',
        [isMobile ? 'borderBottom' : 'borderTop']: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
      }"
    >
      深色模式下，请以微信实际预览结果为准
    </div>
  </Transition>
  </div>
  <Toast :visible="toastVisible" :message="toastMessage" />
</template>

<style scoped>
.preview-scroll::-webkit-scrollbar {
  display: none;
}
.hint-fade-enter-active {
  transition: opacity 0.4s ease;
}
.hint-fade-leave-active {
  transition: opacity 0.6s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}
@media (max-width: 767px) {
  .preview-scroll {
    padding: 0;
  }
}
</style>
