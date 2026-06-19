<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useTheme } from '@/composables/useTheme'
import { useDarkMode } from '@/composables/useDarkMode'
import { getSetting } from '@/config/settings'
import { useAutoUpdater, autoUpdatePending, autoUpdateRid, downloadUpdateWithRid, type UpdateInfo } from '@/composables/useAutoUpdater'
import { autoSaveEnabled, autoSaveInterval } from '@/composables/useEditorSettings'
import { uploadToGitHub } from '@/services/githubUploader'
import { DEMO_CONTENT } from '@/data/demoContent'
import { DraftStorage, type Draft } from '@/services/DraftStorage'
import { extractTitle, sanitizeFilename } from '@/utils/extractTitle'
import Editor from './components/Editor.vue'
import { inlineFormatOptions } from '@/utils/inlineFormat'
import {
  Image, ImageUp, Puzzle, Braces, Baseline,
  Highlighter, Sparkles, Pill, TriangleAlert,
  Underline, Strikethrough, Bold, Italic,
  Code2, Superscript, Subscript, RemoveFormatting,
  Save, SquareBottomDashedScissors, CheckCircle
} from 'lucide-vue-next'

const formatIcons: Record<string, any> = {
  '==': Highlighter,
  '::': Sparkles,
  '!!': Pill,
  '^^': TriangleAlert,
  '__': Baseline,
  '~~': Strikethrough,
  '**': Bold,
  '*': Italic,
  '***': RemoveFormatting,
  '`': Code2,
  'sup': Superscript,
  'sub': Subscript,
  'u': Underline,
}
import Preview from './components/Preview.vue'
import ThemePicker from './components/ThemePicker.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import Dropdown from './components/Dropdown.vue'
import MobileActionsMenu from './components/mobile/MobileActionsMenu.vue'
import XhsExporter from './components/XhsExporter.vue'
import TagPropsForm from './components/TagPropsForm.vue'
import ComponentPickerDialog from './components/ComponentPickerDialog.vue'
import SaveDraftDialog from './components/SaveDraftDialog.vue'
import DraftListDialog from './components/DraftListDialog.vue'
import FinalizeDialog from './components/FinalizeDialog.vue'
import EditorSidebar from './components/EditorSidebar.vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import pkg from '../../../package.json'

// base64 图片数据存储，避免长字符串撑大编辑器
const IMG_STORE_KEY = 'r-markdown-editorImgs'
const base64Store = new Map<string, string>()

// 初始化时从 localStorage 恢复图片数据
;(() => {
  try {
    const raw = localStorage.getItem(IMG_STORE_KEY)
    if (raw) {
      const entries: [string, string][] = JSON.parse(raw)
      for (const [token, b64] of entries) {
        base64Store.set(token, b64)
      }
    }
  } catch {
    /* ignore corrupt data */
  }
})()

function saveBase64Store() {
  if (base64Store.size === 0) {
    localStorage.removeItem(IMG_STORE_KEY)
    return
  }
  const entries = Array.from(base64Store.entries())
  localStorage.setItem(IMG_STORE_KEY, JSON.stringify(entries))
}

function compactBase64(dataUrl: string): string {
  const m = dataUrl.match(/^(data:image\/\w+);base64,(.+)$/)
  if (!m) return dataUrl
  const [, prefix, b64] = m
  if (b64.length <= 100) return dataUrl
  const token = `IMG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  base64Store.set(token, b64)
  return `${prefix};base64,${token}`
}

function resolveBase64(text: string): string {
  if (base64Store.size === 0) return text
  let result = text
  for (const [token, b64] of base64Store) {
    result = result.split(token).join(b64)
  }
  return result
}

function cleanupUnusedBase64() {
  const tokensInUse = new Set(markdown.value.match(/IMG_\d+_[a-z0-9]{6}/g) ?? [])
  let removed = false
  for (const token of base64Store.keys()) {
    if (!tokensInUse.has(token)) {
      base64Store.delete(token)
      removed = true
    }
  }
  if (removed) saveBase64Store()
}

// ── 图片压缩（Canvas） ──
const MAX_DIMENSION = 1920

async function compressImage(file: File, maxSizeKB: number, maxQuality: number): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })

  const canvas = document.createElement('canvas')
  let { width, height } = img
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  const maxBytes = maxSizeKB * 1024
  let low = 0.1
  let high = maxQuality
  let best: Blob | null = null

  for (let i = 0; i < 6; i++) {
    const mid = (low + high) / 2
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', mid)
    })
    if (blob.size <= maxBytes) {
      best = blob
      low = mid
    } else {
      high = mid
    }
  }

  if (!best) {
    best = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', low)
    })
  }

  const newName = file.name.replace(/\.[^.]+$/, '.jpg')
  return new File([best], newName, { type: 'image/jpeg' })
}

const { accent, colors, setTheme, setCustomTheme, customColor, themes } = useTheme()
const { mode: darkMode, isDark, setMode: setDarkMode } = useDarkMode()
useAutoUpdater()

// ── 左侧侧栏 ──
const sidebarTab = ref('editor')

function onSidebarSelect(tab: string) {
  sidebarTab.value = tab
}

function onToggleDarkMode() {
  const cycle: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' }
  setDarkMode(cycle[darkMode.value] as 'light' | 'dark' | 'system')
}

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
  refreshDrafts()
  window.addEventListener('resize', onResize)
  // 恢复页面缩放
  if (import.meta.env.VITE_TAURI === 'true') {
    const val = getSetting<number>('pageZoom')
    if (val >= 50 && val <= 200 && val !== 100) {
      invoke('set_page_zoom', { scale: val / 100 }).catch(() => {})
    }
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

// ── 拖动调整宽度 ──
const previewWidth = ref(430)
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
  const maxW = 700
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

// ── 拖拽条圆形按钮 hover 显示 ──
const resizeHandleRef = ref<HTMLElement | null>(null)
const handleBtnVisible = ref(false)
const handleBtnTop = ref(0)

function onHandleEnter() {
  handleBtnVisible.value = true
}

function onHandleMove(e: MouseEvent) {
  const el = resizeHandleRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const top = e.clientY - rect.top - 12 // 12 = 半按钮高
  const clamped = Math.max(0, Math.min(top, rect.height - 24))
  handleBtnTop.value = clamped
}

function onHandleLeave() {
  handleBtnVisible.value = false
}

const STORAGE_KEY = 'r-markdown-editorContent'
const SAVE_TIME_KEY = 'r-markdown-editorSaveTime'

const saved = localStorage.getItem(STORAGE_KEY)
const markdown = ref(saved !== null ? saved : DEMO_CONTENT)
const resolvedMarkdown = computed(() => resolveBase64(markdown.value))
const previewRef = ref()
const editorRef = ref<InstanceType<typeof Editor>>()
const xhsVisible = ref(false)
const settingsVisible = ref(false)
const isTauri = import.meta.env.VITE_TAURI === 'true'

// ── 自动更新 ──
const autoUpdateDialogVisible = ref(false)
const autoUpdateVersion = ref('')
const autoUpdateObj = ref<UpdateInfo | null>(null)
const autoUpdateRidVal = ref<number | null>(null)
const autoUpdateDownloading = ref(false)
const autoUpdateProgress = ref(0)

watch(autoUpdatePending, (u) => {
  if (u) {
    autoUpdateObj.value = u
    autoUpdateVersion.value = u.version
    autoUpdateDialogVisible.value = true
  }
})

watch(autoUpdateRid, (r) => {
  if (r != null) {
    autoUpdateRidVal.value = r
  }
})

async function doAutoUpdateDownload() {
  autoUpdateDialogVisible.value = false
  if (!autoUpdateObj.value || autoUpdateRidVal.value == null) return
  autoUpdateDownloading.value = true
  autoUpdateProgress.value = 0
  try {
    let total = 0
    let totalSize = 0
    await downloadUpdateWithRid(autoUpdateRidVal.value, (event) => {
      if (event.event === 'Started') {
        totalSize = event.data?.contentLength ?? 0
      } else if (event.event === 'Progress') {
        total += event.data?.chunkLength ?? 0
        if (totalSize > 0) {
          autoUpdateProgress.value = Math.round((total / totalSize) * 100)
        }
      }
    })
    // dev 模式下 restart 不生效，提示手动重启
    showToast('更新已下载，请重启应用以完成安装')
    autoUpdateDownloading.value = false
  } catch (e) {
    console.error('[updater] auto download error:', e, typeof e, JSON.stringify(e))
    showToast(`更新下载失败: ${e}`)
    autoUpdateDownloading.value = false
  }
}

// ── 插入扩展组件 ──
const componentDialogVisible = ref(false)
const confirmLoadVisible = ref(false)

// ── 草稿功能 ──
const draftListVisible = ref(false)
const saveDraftVisible = ref(false)
const finalizeVisible = ref(false)
const finalizeDeleteConfirmVisible = ref(false)
const drafts = ref<Draft[]>([])
const currentDraftId = ref<number | null>(null)

const extractedTitle = computed(() => extractTitle(markdown.value) || '')
const draftCount = computed(() => drafts.value.length)

async function refreshDrafts() {
  drafts.value = await DraftStorage.list()
}

// ── 插入图片 ──
const imageInputRef = ref<HTMLInputElement>()
const githubImageInputRef = ref<HTMLInputElement>()
// ── Toast ──
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 1500)
}

function handleInsertImage() {
  imageInputRef.value?.click()
}

function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 限制最多 10 张图片
  const currentCount = (markdown.value.match(/IMG_\d+_[a-z0-9]{6}/g) ?? []).length
  if (currentCount >= 10) {
    showToast('最多插入 10 张图片')
    input.value = ''
    return
  }

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    input.value = ''
    return
  }

  // 验证文件大小（500KB）
  if (file.size > 500 * 1024) {
    showToast('图片不能超过 500KB')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    const compacted = compactBase64(dataUrl)
    editorRef.value?.insertAtCursor(
      `<img src="${compacted}" width="100%" height="auto" radius="8px" fit="cover" />`,
    )
    // 异步清理不再被引用的旧图片数据
    const cleanup = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
    cleanup(() => cleanupUnusedBase64())
    input.value = ''
  }
  reader.onerror = () => {
    showToast('图片读取失败')
    input.value = ''
  }
  reader.readAsDataURL(file)
}

// ── 粘贴/拖拽图片 ──
async function processImageInsert(file: File, insertAt: number | null = null) {
  // 检查是否在标签内部（不允许在组件标签内插入）
  if (editorRef.value?.isInsideTag) {
    showToast('不能在组件标签内插入图片')
    return
  }

  // 限制最多 10 张图片
  const currentCount = (markdown.value.match(/IMG_\d+_[a-z0-9]{6}/g) ?? []).length
  if (currentCount >= 10) {
    showToast('最多插入 10 张图片')
    return
  }

  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    return
  }

  const mode = getSetting<string>('pasteDropMode') || 'local'

  if (mode === 'github') {
    const repo = getSetting<string>('githubRepo')
    const token = getSetting<string>('githubToken')
    if (!repo || !token) {
      showToast('请先在设置中配置 GitHub 图床')
      return
    }
    let uploadFile = file
    const quality = (getSetting<number>('compressQuality') || 100) / 100
    if (quality < 1.0) {
      showToast('正在压缩图片...')
      uploadFile = await compressImage(file, 5000, quality)
    }
    githubUploading.value = true
    githubUploadProgress.value = 0
    uploadToGitHub(
      uploadFile,
      { repo, token, branch: getSetting<string>('githubBranch') || 'main' },
      (percent) => { githubUploadProgress.value = percent },
    )
      .then((result) => {
        const tag = `<img src="${result.url}" width="100%" height="auto" radius="8px" fit="cover" />`
        if (insertAt !== null) {
          editorRef.value?.replaceRange(insertAt, insertAt, tag)
        } else {
          editorRef.value?.insertAtCursor(tag)
        }
        showToast('上传成功')
      })
      .catch((e: any) => {
        showToast(e.message || '上传失败')
      })
      .finally(() => {
        githubUploading.value = false
        githubUploadProgress.value = 0
      })
    return
  }

  // 本地模式
  let finalFile = file
  const quality = (getSetting<number>('compressQuality') || 100) / 100
  if (quality >= 1.0 && file.size > 1000 * 1024) {
    showToast('图片超过 1MB，请开启压缩或使用图床上传')
    return
  }
  if (quality < 1.0) {
    showToast('正在压缩图片...')
    finalFile = await compressImage(file, 1000, quality)
  }

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    const compacted = compactBase64(dataUrl)
    const tag = `<img src="${compacted}" width="100%" height="auto" radius="8px" fit="cover" />`
    if (insertAt !== null) {
      editorRef.value?.replaceRange(insertAt, insertAt, tag)
    } else {
      editorRef.value?.insertAtCursor(tag)
    }
    const cleanup = window.requestIdleCallback || ((fn: () => void) => setTimeout(fn, 200))
    cleanup(() => cleanupUnusedBase64())
  }
  reader.onerror = () => {
    showToast('图片读取失败')
  }
  reader.readAsDataURL(finalFile)
}

function handlePasteImage(file: File) {
  processImageInsert(file)
}

function handlePasteMultipleImages() {
  showToast('一次只能粘贴一张图片')
}

function handleDropImage(file: File, from: number) {
  processImageInsert(file, from)
}

function handleDropMultipleImages() {
  showToast('一次只能拖入一张图片')
}

function handleDropNonImage() {
  showToast('请拖入图片文件')
}

// ── 图床上传 ──
const githubUploading = ref(false)
const githubUploadProgress = ref(0)

function handleUploadToGitHub() {
  githubImageInputRef.value?.click()
}

async function onGithubImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('图片不能超过 5MB')
    input.value = ''
    return
  }

  const repo = getSetting<string>('githubRepo')
  const token = getSetting<string>('githubToken')
  const branch = getSetting<string>('githubBranch') || 'main'

  if (!repo || !token) {
    showToast('请先在设置中配置 GitHub 图床')
    input.value = ''
    return
  }

  githubUploading.value = true
  githubUploadProgress.value = 0
  try {
    const result = await uploadToGitHub(
      file,
      { repo, token, branch },
      (percent) => {
        githubUploadProgress.value = percent
      },
    )
    editorRef.value?.insertAtCursor(
      `<img src="${result.url}" width="100%" height="auto" radius="8px" fit="cover" />`,
    )
    showToast('上传成功')
  } catch (e: any) {
    showToast(e.message || '上传失败')
  }
  githubUploading.value = false
  githubUploadProgress.value = 0
  input.value = ''
}

// ── 标签解析表单 ──
interface TagInfo {
  tagName: string
  attrs: Record<string, string>
  selfClose: boolean
  from: number
  to: number
}
const tagInfo = ref<TagInfo | null>(null)
const showTagDialog = ref(false)

function onTagSelected(info: TagInfo | null) {
  tagInfo.value = info
}

// 光标离开标签时自动关闭侧栏
watch(tagInfo, (val) => {
  if (!val) showTagDialog.value = false
})

function onTagDialogUpdate(attrs: Record<string, string>) {
  if (!tagInfo.value) return
  const prev = tagInfo.value
  const attrParts = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
  const attrsStr = attrParts ? ` ${attrParts}` : ''
  const newTag = prev.selfClose ? `<${prev.tagName}${attrsStr} />` : `<${prev.tagName}${attrsStr}>`
  editorRef.value?.replaceRange(prev.from, prev.to, newTag)
}

const savedTime = localStorage.getItem(SAVE_TIME_KEY)
function formatTime(full: string) {
  // desktop: MM-DD HH:mm:ss, mobile: MM-DD HH:mm
  let s = full
  if (s.length >= 5 && s[4] === '-') s = s.slice(5) // strip YYYY-
  if (isMobile.value) {
    const lastColon = s.lastIndexOf(':')
    if (lastColon > 0) s = s.slice(0, lastColon)
  }
  return s
}
const saveMode = ref<'自动' | '手动' | ''>(savedTime ? (autoSaveEnabled.value ? '自动' : '手动') : '')
const saveHint = ref(savedTime ? saveMode.value + '保存于 ' + formatTime(savedTime) : '')

let saveTimer: ReturnType<typeof setTimeout> | null = null

function saveContent(value: string, isManual = false) {
  localStorage.setItem(STORAGE_KEY, value)
  saveBase64Store()
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
  saveMode.value = isManual ? '手动' : '自动'
  saveHint.value = saveMode.value + '保存于 ' + formatTime(timeStr)
}

function onInput(value: string) {
  markdown.value = value
  if (!autoSaveEnabled.value) {
    saveHint.value = '未保存'
    return
  }
  saveHint.value = '输入中…'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveContent(value)
  }, autoSaveInterval.value * 1000)
}

// ── 通用下拉菜单数据 ──
const svgDownload = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
const svgImage = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'
const svgXhs = '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>'

const exportItems = [
  { label: '保存图片', svgInner: svgImage, action: 'saveImage' },
  { label: '小红书图', svgInner: svgXhs, action: 'xhs' },
]

function onDropdownSelect(groupId: string, action: string) {
  if (groupId === 'export') {
    if (action === 'saveImage') handleSaveImage()
    else if (action === 'xhs') xhsVisible.value = true
  }
}

function onExampleAction(action: string) {
  if (action === 'download') downloadDemo()
  else if (action === 'load') confirmLoadVisible.value = true
  else if (action === 'aiDemo') openAiDemo()
}

// ── 导入 ──
async function onImportClick() {
  // 判断是否 Tauri 环境
  const isTauri = import.meta.env.VITE_TAURI === 'true'

  if (isTauri) {
    // 桌面端：Tauri 原生对话框
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const filePath = await open({
        multiple: false,
        filters: [{ name: '文档', extensions: ['md', 'txt', 'docx'] }]
      })
      if (!filePath) return

      const fp = Array.isArray(filePath) ? filePath[0] : filePath
      if (fp.endsWith('.docx')) {
        const { readFile } = await import('@tauri-apps/plugin-fs')
        const buffer = await readFile(fp)
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer })
        markdown.value = result.value
      } else {
        const { readTextFile } = await import('@tauri-apps/plugin-fs')
        markdown.value = await readTextFile(fp)
      }
      localStorage.setItem(STORAGE_KEY, markdown.value)
      showToast('导入成功')
    } catch (e: any) {
      showToast(e?.toString() || '导入失败')
      console.error('导入失败:', e)
    }
    return
  }

  // Web 端：浏览器文件选择
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.txt,.docx'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      if (file.name.endsWith('.docx')) {
        const buf = await file.arrayBuffer()
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer: buf })
        markdown.value = result.value
      } else {
        markdown.value = await file.text()
      }
      localStorage.setItem(STORAGE_KEY, markdown.value)
      showToast('导入成功')
    } catch (e: any) {
      showToast(e?.toString() || '导入失败')
      console.error('导入失败:', e)
    }
  })
  input.click()
}

// ── 外链：Tauri 中用系统浏览器打开，Web 中用 window.open ──
const AI_DEMO_URL = 'https://chat.deepseek.com/share/eq2bpaxrcrjbye1hc4'

async function openAiDemo() {
  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(AI_DEMO_URL)
  } catch {
    window.open(AI_DEMO_URL, '_blank', 'noopener,noreferrer')
  }
}

// ── Markdown 自动加载 ──
function loadDemo() {
  base64Store.clear()
  localStorage.removeItem(IMG_STORE_KEY)
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
  saveMode.value = '自动'
  saveHint.value = '自动保存于 ' + formatTime(timeStr)
}

function downloadDemo() {
  try {
    const blob = new Blob([DEMO_CONTENT], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'R-Markdown示例.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('示例下载完成')
  } catch (e) {
    showToast('示例下载失败')
    console.error('下载示例失败:', e)
  }
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

// ── 草稿业务方法 ──
function handleOpenSaveDraft() {
  saveDraftVisible.value = true
}

async function handleSaveDraft(_draftId: number, title: string) {
  const isDup = await DraftStorage.isDuplicate(title, markdown.value, currentDraftId.value ?? undefined)
  if (isDup) {
    showToast('内容无变化，无需重复保存')
    return
  }

  // 如果正在编辑已有草稿但标题变了，按新建处理，保留原草稿
  let targetId: number | undefined
  if (currentDraftId.value) {
    const existing = await DraftStorage.getById(currentDraftId.value)
    if (existing && existing.title === title) {
      targetId = currentDraftId.value
    }
  }

  if (targetId !== undefined) {
    await DraftStorage.save(title, markdown.value, targetId)
  } else {
    const id = await DraftStorage.save(title, markdown.value)
    currentDraftId.value = id
  }

  saveDraftVisible.value = false
  showToast('草稿已保存')
  await refreshDrafts()
}

async function handleLoadDraft(id: number) {
  const draft = await DraftStorage.getById(id)
  if (draft) {
    markdown.value = draft.content
    currentDraftId.value = draft.id!
    showToast('已加载草稿')
    draftListVisible.value = false
  }
}

async function handleDeleteDraft(id: number) {
  await DraftStorage.remove(id)
  if (currentDraftId.value === id) {
    currentDraftId.value = null
  }
  showToast('草稿已删除')
  await refreshDrafts()
}

function handleOpenFinalize() {
  finalizeVisible.value = true
}

async function handleFinalize(title: string) {
  const safeName = sanitizeFilename(title)
  try {
    // 桌面端：弹出原生保存对话框选择路径
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    const filePath = await save({
      defaultPath: safeName + '.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (!filePath) return // 用户取消
    await writeTextFile(filePath, markdown.value)
    showToast('已保存')
  } catch {
    // Web 端 / 对话框失败：降级为下载
    const blob = new Blob([markdown.value], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeName + '.md'
    a.click()
    URL.revokeObjectURL(url)
    showToast('已下载')
  }
  finalizeVisible.value = false
  // 定稿成功后，如有当前草稿则询问是否删除
  if (currentDraftId.value !== null) {
    // 等定稿弹窗关闭动画结束后再弹出确认
    setTimeout(() => {
      finalizeDeleteConfirmVisible.value = true
    }, 200)
  }
}

async function handleDeleteAfterFinalize() {
  finalizeDeleteConfirmVisible.value = false
  if (currentDraftId.value !== null) {
    await DraftStorage.remove(currentDraftId.value)
    currentDraftId.value = null
    showToast('草稿已删除')
    await refreshDrafts()
  }
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
    <div class="toolbar flex items-center justify-between px-4 py-2 shrink-0">
      <div class="flex items-center min-w-0">
        <router-link
          to="/"
          class="flex items-center text-sm font-semibold tracking-tight no-underline"
          style="color: var(--text-primary)"
        >
          <svg class="shrink-0 mr-1.5" viewBox="0 0 24 24" width="26" height="26">
            <rect width="24" height="24" rx="6" :fill="accent" />
            <text x="3.5" y="16" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">RM</text>
          </svg>
          <span class="hidden sm:inline"
            >R-Markdown 编辑器</span
          >
          <span
            class="hidden sm:inline-flex flex-col ml-0.5"
            style="font-size: 0.55em; vertical-align: super; line-height: 1.1"
          >
            <span class="opacity-60">for 公众号</span>
            <span class="opacity-50">v{{ pkg.version }}</span>
          </span>
          <span class="hidden sm:inline text-[11px] opacity-50 ml-1.5 shrink-0">{{ saveHint }}</span>
          <svg v-if="saveMode" class="hidden sm:inline shrink-0 ml-1" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="var(--accent)"/><path d="M3.5 6l1.7 1.7L8.5 4.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="sm:hidden">R-Markdown</span>
        </router-link>
        <span class="sm:hidden text-[11px] opacity-50 ml-2 shrink-0">{{ saveHint }}</span>
        <svg v-if="saveMode" class="sm:hidden shrink-0 ml-1" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="var(--accent)"/><path d="M3.5 6l1.7 1.7L8.5 4.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- 桌面端：显示所有按钮 -->
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white active:scale-[0.97]"
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
        <Dropdown
          group-id="export"
          label="导出"
          :svg-trigger-inner="svgDownload"
          :items="exportItems"
          @select="(action: string) => onDropdownSelect('export', action)"
        />
        <button
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-none rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150 bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] active:scale-[0.97]"
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
          @load-demo="confirmLoadVisible = true"
          @download-demo="downloadDemo"
          @copy-html="handleCopyHTML"
          @save-image="handleSaveImage"
          @copy-rich-text="handleCopyRichText"
          @export-xhs="xhsVisible = true"
          @go-components="$router.push('/components')"
        />
        <ThemePicker
          :themes="themes"
          :current-accent="accent"
          :custom-color="customColor"
          @select="setTheme"
          @custom-select="setCustomTheme"
        />
        <SettingsDialog :visible="settingsVisible" @close="settingsVisible = false" />
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
      <div class="flex flex-1 overflow-hidden" :style="{ padding: isMobile ? '0px' : '10px', background: 'var(--bg-frame)' }">
      <!-- 桌面端左侧侧栏 -->
      <div class="hidden md:flex shrink-0">
        <EditorSidebar
          :active-tab="sidebarTab"
          :dark-mode="darkMode"
          :draft-count="draftCount"
          @select="onSidebarSelect"
          @toggle-dark-mode="onToggleDarkMode"
          @open-settings="settingsVisible = true"
          @open-components="$router.push('/components')"
          @open-drafts="draftListVisible = true"
          @example-action="onExampleAction"
          @open-import="onImportClick"
        />
      </div>
      <!-- Editor Panel -->
      <div
        class="flex flex-col overflow-x-hidden flex-1 min-w-0 relative"
        style="background: var(--bg-primary)"
        :class="{
          'hidden md:flex': mobileTab !== 'editor',
          'mobile-near-bottom': nearBottom && isMobile,
          'rounded-xl': !isMobile,
        }"
      >
        <div
          class="panel-header hidden md:flex items-center justify-between px-4 py-2 border-b text-xs font-semibold shrink-0"
          style="background: var(--bg-primary)"
        >
          <span class="flex flex-wrap items-center gap-3">
            <!-- 操作按钮组：图标+文字 -->
            <span class="flex items-center gap-1">
              <button
                class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn text-[11px] font-medium"
                :class="editorRef?.isAtLineStart ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
                :disabled="!editorRef?.isAtLineStart"
                title="本地插入图片"
                @click="editorRef?.isAtLineStart && handleInsertImage()"
              >
                <Image :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
                <span>本地</span>
              </button>
              <button
                class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn text-[11px] font-medium"
                :class="editorRef?.isAtLineStart && !githubUploading ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
                :disabled="!editorRef?.isAtLineStart || githubUploading"
                title="上传到图床"
                @click="editorRef?.isAtLineStart && !githubUploading && handleUploadToGitHub()"
              >
                <ImageUp :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
                <span>图床</span>
              </button>
              <button
                class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn text-[11px] font-medium"
                :class="editorRef?.isAtLineStart ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
                :disabled="!editorRef?.isAtLineStart"
                title="插入组件"
                @click="editorRef?.isAtLineStart && (componentDialogVisible = true)"
              >
                <Puzzle :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
                <span>组件</span>
              </button>
              <button
                class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn text-[11px] font-medium"
                :class="(tagInfo && !showTagDialog && !isMobile) ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
                :disabled="!tagInfo || showTagDialog || isMobile"
                :title="tagInfo ? '解析 <' + tagInfo.tagName + '> 属性' : '解析标签 — 选中扩展组件标签后可用'"
                @click="tagInfo && !showTagDialog && !isMobile && (showTagDialog = true)"
              >
                <Braces :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
                <span>解析</span>
              </button>
            </span>
            <!-- 分隔符 -->
            <span class="w-px h-4 bg-current opacity-15"></span>
            <!-- 行内样式按钮组 -->
            <span class="flex items-center gap-0.5">
              <button
                v-for="opt in inlineFormatOptions"
                :key="opt.syntax"
                class="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn"
                :class="editorRef?.hasInlineSelection ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
                :disabled="!editorRef?.hasInlineSelection"
                :title="opt.label + '：' + opt.hint"
                @click="editorRef?.hasInlineSelection && editorRef?.applyInlineFormat(opt.syntax, opt.wrapType ?? 'delim')"
              >
                <component :is="formatIcons[opt.syntax]" :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
              </button>
            </span>
            <!-- 帮助提示 -->
            <span class="relative inline-flex items-center group">
              <svg class="w-3.5 h-3.5 text-[#aaa] cursor-help hover:text-[var(--accent)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span class="absolute top-full right-0 mt-1.5 w-56 px-3 py-2 rounded-lg bg-white text-[#333] dark:bg-[#1a1a1a] dark:text-white text-[11px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 shadow-lg border border-[#e5e5e5] dark:border-white/10 pointer-events-none">
                选中非标签内文字后可加样式<br>本地/图床/组件：仅空行可点击<br>解析：选中组件标签后可点击。
              </span>
            </span>
          </span>
          <span class="flex flex-col lg:flex-row lg:items-center gap-1">
          <button
            v-if="isTauri && !autoSaveEnabled"
            class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent transition-all duration-150 panel-action-btn text-[11px] font-medium cursor-pointer whitespace-nowrap"
            title="暂存"
            @click="saveContent(markdown, true)"
          >
            <Save :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
            <span>暂存</span>
          </button>
          <button
            class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent
                   transition-all duration-150 panel-action-btn text-[11px] font-medium cursor-pointer whitespace-nowrap"
            title="保存草稿"
            @click="handleOpenSaveDraft"
          >
            <SquareBottomDashedScissors :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
            <span>草稿</span>
          </button>
          <button
            class="inline-flex items-center gap-1 h-7 px-2 rounded-[5px] border-none bg-transparent
                   transition-all duration-150 panel-action-btn text-[11px] font-medium cursor-pointer whitespace-nowrap"
            title="定稿导出"
            @click="handleOpenFinalize"
          >
            <CheckCircle :size="14" class="w-3.5 h-3.5" :style="{ color: colors.accent }" />
            <span>定稿</span>
          </button>
          </span>
        </div>
        <!-- 图床上传进度 -->
        <div
          v-if="githubUploading"
          class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl bg-[#111] text-white text-sm shadow-lg"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <span>正在上传到 GitHub...</span>
            <span class="font-medium text-[var(--accent)]">{{ githubUploadProgress }}%</span>
          </div>
          <div class="h-1 w-48 rounded-full bg-[#444] overflow-hidden">
            <div
              class="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              :style="{ width: githubUploadProgress + '%' }"
            />
          </div>
        </div>
        <div class="flex flex-1 overflow-hidden">
          <Editor
            ref="editorRef"
            class="flex-1"
            :model-value="markdown"
            @update:model-value="onInput"
            @scroll="onEditorScrollAll"
            @tag-selected="onTagSelected"
            @paste-image="handlePasteImage"
            @paste-multiple-images="handlePasteMultipleImages"
            @drop-image="handleDropImage"
            @drop-multiple-images="handleDropMultipleImages"
            @drop-non-image="handleDropNonImage"
          />
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onImageSelected"
          />
          <input
            ref="githubImageInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onGithubImageSelected"
          />
          <TagPropsForm
            :visible="showTagDialog && !isMobile"
            :tag-info="tagInfo"
            @close="
              showTagDialog = false;
              tagInfo = null
            "
            @update="onTagDialogUpdate"
          />
        </div>
      </div>

      <!-- Resize Handle (仅桌面端) -->
      <div
        class="resize-handle hidden md:block"
        @mousedown="onDragStart"
        @mouseenter="onHandleEnter"
        @mousemove="onHandleMove"
        @mouseleave="onHandleLeave"
        ref="resizeHandleRef"
      >
        <div
          class="resize-handle-btn"
          :class="{ 'resize-handle-btn--visible': handleBtnVisible }"
          :style="{ top: handleBtnTop + 'px' }"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 8 21 12 17 16" />
            <polyline points="7 8 3 12 7 16" />
          </svg>
        </div>
      </div>

      <!-- Preview Panel -->
      <div
        class="flex flex-col overflow-hidden flex-1 md:flex-none"
        :class="{
          'hidden md:flex': mobileTab !== 'preview',
          'mobile-near-bottom': nearBottom && isMobile,
          'rounded-xl': !isMobile,
        }"
        :style="isMobile ? { background: '#fff' } : { width: previewWidth + 'px', background: '#fff' }"
      >
        <Preview ref="previewRef" :markdown="resolvedMarkdown" :colors="colors" :is-mobile="isMobile" />
      </div>
      </div>
    </div>

    <XhsExporter
      :visible="xhsVisible"
      :markdown="resolvedMarkdown"
      :colors="colors"
      @close="xhsVisible = false"
      @toast="showToast"
    />
    <ComponentPickerDialog
      :visible="componentDialogVisible"
      @close="componentDialogVisible = false"
      @insert="(code: string) => editorRef?.insertAtCursor(code)"
    />
    <Toast :visible="toastVisible" :message="toastMessage" />
    <ConfirmDialog
      :visible="confirmLoadVisible"
      title="加载示例"
      message="加载示例将覆盖当前编辑内容，确定继续吗？"
      confirm-text="加载"
      @confirm="loadDemo"
      @update:visible="confirmLoadVisible = $event"
    />
    <!-- 自动更新确认弹窗 -->
    <ConfirmDialog
      :visible="autoUpdateDialogVisible"
      title="发现新版本"
      :message="`版本 ${autoUpdateVersion} 可用，是否立即下载安装？`"
      confirm-text="立即更新"
      @confirm="doAutoUpdateDownload"
      @update:visible="autoUpdateDialogVisible = $event"
    />
    <!-- 自动更新下载进度 -->
    <div
      v-if="autoUpdateDownloading"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl bg-[#111] text-white text-sm shadow-lg"
    >
      <div class="flex items-center gap-2 mb-1.5">
        <span>正在下载更新...</span>
        <span class="font-medium text-[var(--accent)]">{{ autoUpdateProgress }}%</span>
      </div>
      <div class="h-1 w-48 rounded-full bg-[#444] overflow-hidden">
        <div
          class="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          :style="{ width: autoUpdateProgress + '%' }"
        />
      </div>
    </div>
    <!-- 定稿后删除草稿确认弹窗 -->
    <ConfirmDialog
      :visible="finalizeDeleteConfirmVisible"
      title="定稿完成"
      message="定稿已保存，是否删除当前草稿？"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="handleDeleteAfterFinalize"
      @update:visible="finalizeDeleteConfirmVisible = $event"
    />
  </div>

  <!-- 草稿列表弹窗 -->
  <DraftListDialog
    :visible="draftListVisible"
    :drafts="drafts"
    @close="draftListVisible = false"
    @load="handleLoadDraft"
    @delete="handleDeleteDraft"
  />

  <!-- 保存草稿弹窗 -->
  <SaveDraftDialog
    :visible="saveDraftVisible"
    :initial-title="extractedTitle"
    @close="saveDraftVisible = false"
    @saved="handleSaveDraft"
  />

  <!-- 定稿弹窗 -->
  <FinalizeDialog
    :visible="finalizeVisible"
    :initial-title="extractedTitle"
    @close="finalizeVisible = false"
    @finalize="handleFinalize"
  />
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

/* 面板操作按钮 - 结构用 Tailwind，仅保留 CSS 变量相关样式 */
.panel-action-btn {
  color: var(--text-secondary);
}
.panel-action-btn:hover {
  color: var(--accent, #6c5ce7);
  background: var(--accent-light, rgba(108, 92, 231, 0.08));
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
