<script setup lang="ts">
import { ref, watch } from 'vue'
import { toPng } from 'html-to-image'
import type { ThemeColors } from '@/composables/useTheme'
import { parseMarkdown } from '@/utils/markdownParser'

const props = defineProps<{
  markdown: string
  colors: ThemeColors
}>()

const previewRef = ref<HTMLElement>()
const saving = ref(false)

function updateContent() {
  const el = previewRef.value
  if (!el) return
  el.innerHTML = parseMarkdown(props.markdown, props.colors)
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
      showToast('✅ 已复制富文本，可直接粘贴到公众号后台')
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
      showToast('✅ 已复制富文本（降级模式）')
    })
}

function copyHTML() {
  const el = previewRef.value
  if (!el) return
  navigator.clipboard
    .writeText(el.innerHTML)
    .then(() => {
      showToast('✅ 已复制 HTML 源码（全部内联样式）')
    })
    .catch(() => {
      const ta = document.createElement('textarea')
      ta.value = el.innerHTML
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast('✅ 已复制 HTML 源码')
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
    showToast('✅ 图片已保存')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast('❌ 生成失败：' + msg)
  } finally {
    saving.value = false
  }
}

function showToast(msg: string) {
  const t = document.createElement('div')
  t.className = 'toast show'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => document.body.removeChild(t), 300)
  }, 2000)
}

defineExpose({ copyRichText, copyHTML, saveAsImage })
</script>

<template>
    <div
    class="preview-scroll"
    style="
      height: 100%;
      overflow-y: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    "
  >
    <div
      class="phone-frame"
      style="
        width: 100%;
        max-width: 700px;
        flex-shrink: 0;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        margin: 0 auto;
      "
    >
      <div
        ref="previewRef"
        style="
          padding: 20px 20px 20px;
          color: #333;
          font-size: 15px;
          line-height: 1.8;
          word-wrap: break-word;
          overflow-wrap: break-word;
          background-color: #fff;
        "
      ></div>
    </div>
  </div>
</template>

<style scoped>
.preview-scroll {
  padding: 16px;
}
.preview-scroll::-webkit-scrollbar {
  display: none;
}
@media (max-width: 767px) {
  .preview-scroll {
    padding: 0;
  }
}
</style>
