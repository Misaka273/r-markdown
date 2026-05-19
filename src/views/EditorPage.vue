<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useDarkMode } from '../composables/useDarkMode'
import Editor from '../components/Editor.vue'
import Preview from '../components/Preview.vue'
import ThemePicker from '../components/ThemePicker.vue'
import DarkModeToggle from '../components/DarkModeToggle.vue'

const { accent, colors, setTheme, setCustomTheme, customColor, themes } = useTheme()
const { mode: darkMode, setMode: setDarkMode } = useDarkMode()

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

const DEMO_CONTENT = `---
title: 功能全集：排版组件指南
badge: GUIDE
subtitle: 这是一份包含所有可用 Markdown 指令及扩展标签的完整演示稿。
chips: 图片并排|窗口滚动|渐变文字
---

## 01 图片增强特性 :: IMAGES · 窗口化与并排

这是本次更新的核心功能，解决了长图刷屏和多图堆叠的问题。

### 01 指定窗口尺寸（限制高度 250px）

![限高滚动测试](https://robocopmao.github.io/r-markdown/banner4.webp)[100% 250px]

> 上方的图片被限制在 250px 高度内，读者可以手动滚动查看。

### 02 多图横向滑动并排

< ![图1](https://robocopmao.github.io/r-markdown/banner1.webp), ![图2](https://robocopmao.github.io/r-markdown/banner2.webp), ![图3](https://robocopmao.github.io/r-markdown/banner3.webp) >

> 使用尖括号和感叹号语法，多张图片横向排开。

## 02 行内修饰与文字 :: STYLES · 渐变与强调

- **渐变背景**：==这是 linear-gradient 渐变背景文字==，适合划重点。
- **胶囊文字**：!!这是超圆角胶囊背景文字!!，适合做小标签。
- **靛青强调**：^^这是 Indigo 加重强调文字^^，颜色更深。
- **柔光重点**：::这是柔光蓝紫色文字重点::。
- **经典修饰**：**粗体文字**、__下划线文字__、~~删除线文字~~。

## 03 核心交互组件 :: COMPONENTS · 卡片与布局

### 01 突发/重大更新卡片 (Breaking)

<breaking badge="NEW" title="功能全集文档上线" subtitle="支持一键复制，即装即用" chips="高效|美观">
这个组件适合用于文章开头，展示最重要的核心结论或更新摘要。
</breaking>

### 02 提示与建议 (Callout)

> [TIP] 操作小贴士
> 使用 [TIP] 或 [NOTE] 可以快速生成带背景的提示框。

### 03 横向步骤流 (Horizontal Steps)

::: steps label="HOW IT WORKS" title="安装好之后怎么跑起来" hint="左右滑动查看" active="2"
- 输入 | 往知识库里喂东西
- 管理 | 让知识库有序运转
- 输出 | 从知识库取素材做东西
:::

### 04 实践案例流 (Case Flow)

- [案例 01] 品牌视觉升级：从绿色全面转向现代化的 Indigo 靛青色调。
- [案例 02] 交互体验优化：图片窗口化功能让长文阅读更流畅。

## 04 布局演示 :: LAYOUT · 对比与引导

### 01 Before / After 对比

<compare left-label="BEFORE" left-title="旧版绿色" right-label="AFTER" right-title="新版靛青">
<left>
![旧版](https://robocopmao.github.io/r-markdown/banner1.webp)[100% 120px]
</left>
<right>
![新版](https://robocopmao.github.io/r-markdown/banner2.webp)[100% 120px]
</right>
</compare>

### 02 行动点召唤 (CTA)

<cta label="GET STARTED" title="准备好开始你的创作了吗？" button="立即复制下方代码"></cta>

## 05 其他组件用法 :: MISC · 标签与代码

### 01 彩色标签徽章 (Badges)

::: badges tone="accent"
Vue|TypeScript|Vite|Tailwind
:::

> 使用 \`tone\` 属性切换风格：\`accent\`（主题色）、\`green\`（绿色）、\`yellow\`（黄色）、\`dark\`（深色）。

### 02 代码块 (Code Block)

\`\`\`javascript
// 一个简单的 Vue 组件示例
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
  console.log('Count:', count.value)
}
\`\`\`

> 代码块会保留原始格式，包括换行和缩进，适合展示代码片段。

### 03 居中强调语 (Statement)

::: statement
这是一段居中的强调文字，适合用来突出核心观点或结论。
:::

> Statement 组件会将文字居中显示，字号较大且加粗，非常适合用作文章中的金句或核心观点。

### 04 引导文字段 (Lead)

::: lead
Lead 组件会生成一段带有左侧边框的引导文字，适合用来引入话题或提供背景信息。它的视觉效果比普通段落更突出，但又不会像 Statement 那样过于正式。
:::

> Lead 组件的左侧边框颜色会跟随主题色变化，非常适合用作文章的引言或过渡段落。

## 写在最后 :: CONCLUSION · 结尾互动

所有组件都支持公众号无损复制，您可以根据需要自由组合。

: engage title="如果这份文档对你有帮助，欢迎点赞、推荐、转发！" label="THANKS FOR READING"
`

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
    handlePreviewScroll(previewScrollEl.scrollTop / maxScroll)
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
      <div class="flex items-center">
                <router-link to="/" class="flex items-center text-sm font-semibold tracking-tight no-underline" style="color: var(--text-primary)">
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
          R-Markdown 编辑器
          <span class="text-[0.55em] opacity-60 align-super ml-0.5">for 公众号</span>
                </router-link>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
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
          class="inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
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
          class="inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
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
          class="inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] active:scale-[0.97]"
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
    <div class="flex flex-1 overflow-hidden">
      <!-- Editor Panel -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div
          class="panel-header flex items-center justify-between px-4 py-2 border-b text-xs font-semibold shrink-0"
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
        <Editor
          :model-value="markdown"
          @update:model-value="onInput"
          @scroll="handleEditorScroll"
        />
      </div>

      <!-- Resize Handle -->
      <div class="resize-handle" @mousedown="onDragStart"></div>

      <!-- Preview Panel -->
      <div class="flex flex-col overflow-hidden" :style="{ width: previewWidth + 'px' }">
        <div
          class="panel-header flex items-center justify-between px-4 py-2 border-b text-xs font-semibold shrink-0"
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
