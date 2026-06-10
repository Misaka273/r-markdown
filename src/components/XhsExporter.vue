<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { toPng } from 'html-to-image'
import { parseMarkdown } from '@/utils/markdownParser'
import type { ThemeColors } from '@/composables/useTheme'
import {
  extractXhs,
  buildCover,
  ASPECTS,
  PIXEL_RATIO,
  FONT_STACK,
  CONTENT_SCALE,
  XHS,
  DEFAULT_BRAND,
  type XhsAspect,
} from '@/utils/xhsCards'
import PromptDialog from './PromptDialog.vue'

// 图片加载失败时的占位（透明 1px），避免一张坏图把整次渲染拖崩
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

// html-to-image 失败常常抛的是一个 Event（图片加载错误），直接 String() 会变 [object Event]
function errText(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof Event !== 'undefined' && e instanceof Event) return '渲染失败（可能有图片加载不出来）'
  return String(e)
}

// 图片加载失败（含 dev server 把缺图当 index.html 返回、跨域等）时不让整张渲染崩，
// 把这张图换成透明占位，渲染照常进行，缺图位置留白。
function onImgError(e: Event | string) {
  if (typeof e === 'string') return
  const t = e.target as HTMLImageElement | null
  if (t && 'src' in t) t.src = TRANSPARENT_PX
}

// 小节标题块：原生 #~#### 渲染成 H1~H4；<p-title> 渲染成带 data-block="ptitle" 的 section
function isHeadingBlock(el: HTMLElement): boolean {
  return /^H[1-6]$/.test(el.tagName) || el.dataset?.block === 'ptitle'
}

const props = defineProps<{
  visible: boolean
  markdown: string
  colors: ThemeColors
}>()

const emit = defineEmits<{ close: []; toast: [msg: string] }>()

interface Card {
  id: string
  label: string
  kind: 'html' | 'image'
  html?: string // 首图：HTML，导出时 toPng
  src?: string // 内容图：已经切好的 PNG dataURL
}

const aspect = ref<XhsAspect>('3:4')
const cards = ref<Card[]>([])
const building = ref(false)
const busy = ref(false)
const status = ref('')

// 滑块动画
const btn34 = ref<HTMLButtonElement | null>(null)
const btn11 = ref<HTMLButtonElement | null>(null)
const sliderStyle = ref<Record<string, string>>({})

function updateSlider() {
  const btn = aspect.value === '3:4' ? btn34.value : btn11.value
  if (!btn) return
  const parent = btn.parentElement
  if (!parent) return
  const parentRect = parent.getBoundingClientRect()
  const btnRect = btn.getBoundingClientRect()
  // 滑块比按钮小 4px，左边缩进 0px、右边缩进 4px
  const gapLeft = 0
  const gapRight = 4
  sliderStyle.value = {
    width: `${btnRect.width - gapLeft - gapRight}px`,
    transform: `translateX(${btnRect.left - parentRect.left + gapLeft}px)`,
  }
}

watch(aspect, () => nextTick(updateSlider))

// 初始化滑块位置（等弹窗渲染完毕再测量）
onMounted(() => {
  // 多帧延迟确保弹窗完全渲染并布局
  requestAnimationFrame(() => requestAnimationFrame(updateSlider))
})

// 品牌名设置
const BRAND_KEY = 'r-markdown-xhs-brand'
const brand = ref(localStorage.getItem(BRAND_KEY) || DEFAULT_BRAND)
const showBrandInput = ref(false)

function openBrandSettings() {
  showBrandInput.value = true
}

function onBrandSave(val: string) {
  if (val) {
    brand.value = val
    localStorage.setItem(BRAND_KEY, val)
  } else {
    brand.value = DEFAULT_BRAND
    localStorage.removeItem(BRAND_KEY)
  }
  if (props.visible) generate()
}

// 首图卡的外层 DOM（导出时读它第一个子元素，即卡片 section）
let cardEls: (HTMLElement | null)[] = []
function setRef(el: Element | null, idx: number) {
  cardEls[idx] = el as HTMLElement | null
}

/** 等容器里图片都加载完（带 4s 兜底），否则渲染会拿到错的高度。 */
function waitImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img'))
  if (!imgs.length) return Promise.resolve()
  return new Promise((resolve) => {
    let done = 0
    const tick = () => {
      done += 1
      if (done >= imgs.length) resolve()
    }
    setTimeout(resolve, 4000)
    imgs.forEach((img) => {
      if (img.complete) tick()
      else {
        img.onload = tick
        img.onerror = tick
      }
    })
  })
}

/**
 * 内容图：和「保存图片」一样把正文渲染出来，但用一个卡片大小的取景窗，
 * 每次把正文上移一屏、单独导出一张（每张都小、稳，不会因整篇太长或坏图崩掉）。
 * 底部留一条 DOM 页脚带（@品牌 + 页码），盖住被切断的半行。
 */
async function renderSlices(
  contentHtml: string,
  brand: string,
  colors: ThemeColors,
): Promise<string[]> {
  // 在「放大的逻辑画布」上渲染正文：边距/页脚等比放大、正文字号不变 → 输出（仍 1080 宽）
  // 里正文相对更小、更密，而边距和页脚跟首图保持一致。
  const base = ASPECTS[aspect.value]
  const NATIVE_W = base.w * PIXEL_RATIO // 输出宽度（1080）
  // 关键：用「实时预览」的内容宽度当基准，让内容图和「保存图片」共用同一套排版比例
  // （字号、换行、左右边距都一致）。CONTENT_SCALE 是在此基础上的密度倍数（1 = 完全对齐）。
  const previewInner = document.querySelector('.phone-frame > div') as HTMLElement | null
  const refW = previewInner && previewInner.clientWidth > 80 ? previewInner.clientWidth : 450
  const w = Math.round(refW * CONTENT_SCALE)
  const h = Math.round((w * base.h) / base.w) // 保持比例（3:4 / 1:1）
  const ratio = NATIVE_W / w // 缩放到 1080 宽输出
  // 正文与「保存图片」一致：白底 + 同样的左右/上边距 + 同样的基础字号/行距。
  const bg = '#ffffff'
  const padX = 16 // 对齐「保存图片」的左右边距
  const padTop = 20 // 对齐「保存图片」的上边距
  const footerBand = 44
  const fBrand = 14
  const fPage = 13
  const dash = '1.5'

  // 隐藏器：0×0 + overflow 裁切，把取景窗藏起来但保留布局尺寸。
  // 注意不能用 position:fixed;left:-99999px 来藏取景窗——那样在 html-to-image 生成的
  // SVG foreignObject 里会被定位到画布外，导出就是空白。取景窗本身必须是 relative。
  const hider = document.createElement('div')
  hider.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;z-index:-1'

  // 取景窗：定宽定高 + overflow 裁切（relative，作为内部绝对定位正文的包含块）
  const frame = document.createElement('div')
  frame.style.cssText =
    `position:relative;width:${w}px;height:${h}px;overflow:hidden;` +
    `box-sizing:border-box;background:${bg};font-family:${FONT_STACK}`

  // 正文层：绝对定位，靠改 top 往上滚
  const wrap = document.createElement('div')
  // 基础字号/行距/颜色对齐 Preview 的 previewRef（15px / 1.8 / #333），
  // 这样列表、零散文本等没单独设字号的内容也跟「保存图片」一致。
  wrap.style.cssText =
    `position:absolute;left:0;top:0;width:${w}px;box-sizing:border-box;` +
    `padding:${padTop}px ${padX}px 0;font-size:15px;line-height:1.8;color:rgb(51,51,51)`
  wrap.innerHTML = contentHtml

  // 页脚带：整条不透明底色，盖住正文被切断处；内部虚线 + @品牌 + 页码
  const footer = document.createElement('div')
  footer.style.cssText =
    `position:absolute;left:0;right:0;bottom:0;height:${footerBand}px;background:${bg};` +
    `box-sizing:border-box;padding:0 ${padX}px;z-index:2`
  const inner = document.createElement('div')
  inner.style.cssText =
    `height:100%;display:flex;align-items:center;justify-content:space-between;` +
    `border-top:${dash}px dashed ${XHS.dash}`
  const brandEl = document.createElement('span')
  brandEl.style.cssText = `font-size:${fBrand}px;color:${colors.dark};font-weight:800`
  brandEl.textContent = '@' + brand
  const pageEl = document.createElement('span')
  pageEl.style.cssText = `font-size:${fPage}px;color:${XHS.inkFaint};font-weight:800;letter-spacing:0.5px`
  inner.append(brandEl, pageEl)
  footer.append(inner)

  frame.append(wrap, footer)
  hider.appendChild(frame)
  document.body.appendChild(hider)
  await waitImages(frame)

  // 按「块」分页：parseMarkdown 把每段 / 标题 / 引用 / 图片都包成顶层块。
  // 每页放整数个块、块绝不跨页；把不属于本页的块设成 visibility:hidden
  // （占位不变、偏移稳定，但不显示），这样下一块不会从底部露出来 → 不切断、不重复、不丢。
  const topInset = padTop // 每页顶部留白
  const budget = h - footerBand - topInset // 每页可用正文高度（页脚以上、扣掉顶部留白）
  const blocks = Array.from(wrap.children) as HTMLElement[]

  // 把块连续切成若干页 [startIdx, endIdx)
  const pages: { startIdx: number; endIdx: number; top: number }[] = []
  let k = 0
  while (k < blocks.length) {
    const pageTop = blocks[k].offsetTop
    let j = k
    while (j < blocks.length) {
      const bottom = blocks[j].offsetTop + blocks[j].offsetHeight
      // j 放不下且本页已有块 → 收尾；本页第一个块再高也先放进来（避免死循环）
      if (j > k && bottom - pageTop > budget) break
      j++
    }
    // 孤儿标题：本页最后一个块是小节标题、且本页不止它一个 → 让标题跟着正文挪到下一页
    while (j - k > 1 && isHeadingBlock(blocks[j - 1])) j--
    pages.push({ startIdx: k, endIdx: j, top: pageTop })
    k = j
  }
  if (!pages.length) pages.push({ startIdx: 0, endIdx: 0, top: 0 })

  const n = pages.length
  const slices: string[] = []
  try {
    for (let i = 0; i < n; i++) {
      const { startIdx, endIdx, top } = pages[i]
      blocks.forEach((b, idx) => {
        b.style.visibility = idx >= startIdx && idx < endIdx ? 'visible' : 'hidden'
      })
      wrap.style.top = `${topInset - top}px`
      pageEl.textContent = `${i + 1} / ${n}`
      slices.push(
        await toPng(frame, {
          pixelRatio: ratio,
          width: w,
          height: h,
          backgroundColor: bg,
          skipFonts: true,
          imagePlaceholder: TRANSPARENT_PX,
          onImageErrorHandler: onImgError,
        }),
      )
    }
  } finally {
    document.body.removeChild(hider)
  }
  return slices
}

async function generate() {
  building.value = true
  status.value = ''
  try {
    const { meta, contentMd } = extractXhs(props.markdown)
    // 优先使用用户设置的品牌名
    meta.brand = brand.value || DEFAULT_BRAND
    const cover: Card = {
      id: 'cover',
      label: '首图（大字报）',
      kind: 'html',
      html: buildCover(meta, aspect.value, props.colors),
    }
    const contentHtml = parseMarkdown(contentMd, props.colors)
    const slices = contentHtml.trim()
      ? await renderSlices(contentHtml, meta.brand, props.colors)
      : []

    cardEls = []
    cards.value = [
      cover,
      ...slices.map((src, i) => ({
        id: 'p' + i,
        label: `内容 ${i + 1}`,
        kind: 'image' as const,
        src,
      })),
    ]
    await nextTick()
  } catch (e) {
    status.value = '生成失败：' + errText(e)
  } finally {
    building.value = false
  }
}

async function cardDataUrl(idx: number): Promise<string> {
  const card = cards.value[idx]
  if (card.kind === 'image') return card.src as string
  const node = cardEls[idx]?.firstElementChild as HTMLElement | undefined
  if (!node) throw new Error('卡片节点丢失')
  const { w, h } = ASPECTS[aspect.value]
  return toPng(node, {
    pixelRatio: PIXEL_RATIO,
    width: w,
    height: h,
    backgroundColor: XHS.bg,
    skipFonts: true,
    imagePlaceholder: TRANSPARENT_PX,
    onImageErrorHandler: onImgError,
  })
}

function fileName(idx: number): string {
  const date = new Date().toISOString().slice(0, 10)
  const tag = idx === 0 ? '00_cover' : String(idx).padStart(2, '0')
  return `xhs_${date}_${tag}.png`
}

function triggerDownload(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.download = name
  a.href = dataUrl
  a.click()
}

async function downloadOne(idx: number) {
  if (busy.value) return
  busy.value = true
  try {
    triggerDownload(await cardDataUrl(idx), fileName(idx))
    emit('toast', '已保存')
  } catch (e) {
    status.value = '导出失败：' + errText(e)
  } finally {
    busy.value = false
  }
}

async function downloadAll() {
  if (busy.value || !cards.value.length) return
  busy.value = true
  try {
    for (let i = 0; i < cards.value.length; i++) {
      status.value = `导出中 ${i + 1}/${cards.value.length}…`
      triggerDownload(await cardDataUrl(i), fileName(i))
      await new Promise((r) => setTimeout(r, 180))
    }
    status.value = `已导出 ${cards.value.length} 张`
  } catch (e) {
    status.value = '导出失败：' + errText(e)
  } finally {
    busy.value = false
  }
}

function setAspect(a: XhsAspect) {
  if (aspect.value === a) return
  aspect.value = a
  if (props.visible) generate()
}

watch(
  () => props.visible,
  (v) => {
    if (v) generate()
    // 弹窗打开后重新计算滑块位置
    if (v) nextTick(() => requestAnimationFrame(() => requestAnimationFrame(updateSlider)))
  },
)
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/55 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      class="xhs-exporter-modal w-full max-w-[960px] max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.3)]"
    >
      <!-- 头部 -->
      <header
        class="xhs-exporter-header flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-gray-200 shrink-0 sm:gap-3 sm:px-4 sm:py-3.5"
      >
        <strong class="xhs-exporter-title text-[13px] sm:text-[15px] whitespace-nowrap"
          >导出小红书图</strong
        >

        <!-- 比例选择 -->
        <div
          class="xhs-ratio-selector relative flex gap-0.5 bg-[#f3f0ea] rounded-full p-0.5 sm:gap-1"
        >
          <!-- 滑块 -->
          <div
            class="absolute top-0.5 bottom-0.5 rounded-full bg-[var(--accent)] transition-all duration-300 ease-out"
            :style="sliderStyle"
          ></div>
          <button
            ref="btn34"
            class="relative border-none px-2 py-1 rounded-full text-[11px] font-semibold cursor-pointer sm:px-3 sm:text-xs whitespace-nowrap z-10"
            :class="aspect === '3:4' ? 'text-white' : 'text-[#8a8175]'"
            @click="setAspect('3:4')"
          >
            <span class="sm:hidden">3:4</span><span class="hidden sm:inline">3:4 竖版</span>
          </button>
          <button
            ref="btn11"
            class="relative border-none px-2 py-1 rounded-full text-[11px] font-semibold cursor-pointer sm:px-3 sm:text-xs whitespace-nowrap z-10"
            :class="aspect === '1:1' ? 'text-white' : 'text-[#8a8175]'"
            @click="setAspect('1:1')"
          >
            <span class="sm:hidden">1:1</span><span class="hidden sm:inline">1:1 方版</span>
          </button>
        </div>

        <!-- 设置按钮 -->
        <button
          class="xhs-exporter-brand-btn border-none bg-transparent text-[#8a8175] cursor-pointer p-1.5 rounded-md flex items-center justify-center transition-colors hover:bg-[#f3f0ea] hover:text-[var(--accent)]"
          @click="openBrandSettings"
          title="设置品牌名"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            ></path>
          </svg>
        </button>

        <span class="hidden sm:inline flex-1 text-xs text-[#a89a86] text-right">{{ status }}</span>

        <button
          class="border border-[var(--accent)] bg-[var(--accent)] text-white rounded-lg px-2.5 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed sm:px-3 sm:text-[13px] whitespace-nowrap ml-auto sm:ml-0"
          :disabled="busy || building || !cards.length"
          @click="downloadAll"
        >
          下载全部（{{ cards.length }}）
        </button>

        <button
          class="xhs-exporter-close-btn border-none bg-transparent text-base text-gray-400 cursor-pointer px-1.5 py-1 hover:text-gray-600 sm:px-2"
          @click="$emit('close')"
        >
          ✕
        </button>
      </header>

      <!-- 内容区 -->
      <div class="xhs-exporter-content overflow-auto p-5 bg-[#f6f5f2]">
        <p v-if="building" class="text-center text-gray-400 text-[13px] p-5">生成中…</p>
        <div class="flex flex-wrap gap-5 justify-center">
          <div v-for="(c, idx) in cards" :key="c.id" class="flex flex-col gap-2">
            <div
              v-if="c.kind === 'html'"
              class="w-[360px] rounded-[10px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.12)] leading-none"
              :ref="(el) => setRef(el as Element | null, idx)"
              v-html="c.html"
            ></div>
            <img
              v-else
              class="w-[360px] rounded-[10px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.12)] leading-none block h-auto"
              :src="c.src"
              alt=""
            />
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-[#8a8175] font-semibold">{{ c.label }}</span>
              <button
                class="xhs-exporter-download-one border border-[var(--accent)] bg-white text-[var(--accent)] rounded-lg px-3 py-1.5 text-[13px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] hover:text-white transition-colors"
                :disabled="busy"
                @click="downloadOne(idx)"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 品牌名设置弹窗 -->
    <PromptDialog
      v-model:visible="showBrandInput"
      :value="brand"
      title="设置品牌名"
      description="设置后将显示在小红书图片底部"
      placeholder="请输入品牌名"
      @save="onBrandSave"
    />
  </div>
</template>

<style scoped>
/* 亮色模式标题 */
.xhs-exporter-title {
  color: #1f1a17;
}
/* 深色模式 */
[data-theme='dark'] .xhs-exporter-modal {
  background: #1e1e1e;
}
[data-theme='dark'] .xhs-exporter-header {
  border-color: #333;
}
/* 比例选择器暗色适配 */
[data-theme='dark'] .xhs-ratio-selector {
  background: #333;
}
[data-theme='dark'] .xhs-ratio-selector button {
  color: #999;
}
[data-theme='dark'] .xhs-ratio-selector button.text-white {
  color: #fff;
}
[data-theme='dark'] .xhs-exporter-header strong,
[data-theme='dark'] .xhs-exporter-title {
  color: #fff;
}
[data-theme='dark'] .xhs-exporter-content {
  background: #161616;
}
[data-theme='dark'] .xhs-exporter-brand-btn {
  color: #ccc;
}
[data-theme='dark'] .xhs-exporter-brand-btn:hover {
  background: #333;
}
[data-theme='dark'] .xhs-exporter-close-btn {
  color: #888;
}
[data-theme='dark'] .xhs-exporter-close-btn:hover {
  color: #ccc;
}
[data-theme='dark'] .xhs-exporter-download-one {
  background: #2a2a2a;
  border-color: #444;
}
[data-theme='dark'] .xhs-exporter-download-one:hover {
  background: var(--accent);
  border-color: var(--accent);
}
</style>
