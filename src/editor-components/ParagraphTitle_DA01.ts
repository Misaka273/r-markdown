import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * ParagraphTitle_DA01 - 段落标题（默认A型01号样式）
 *
 * 编辑器语法：
 *   <p-title num="01" subtitle="PARAGRAPH TITLE · 分段标题">段落标题组件</p-title>
 *   <p-title num="02">第二章标题</p-title>
 *
 * 属性：
 *   num      - 序号，如 01、02（必填）
 *   subtitle - 副标题文字（可选）
 *   color    - 自定义颜色（可选，默认使用主题色）
 */

// ── 样式常量 ──────────────────────────────────────────
const S = {
  // 外层容器
  wrapper: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `position:relative;margin:40px 0px 20px;padding:24px 0px 20px;`
         + `overflow:hidden`
  },
  // 顶部横线
  topLine: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `display:flex;align-items:center;gap:12px;margin-bottom:16px`
  },
  // 横线
  line: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `flex:1;height:1px;background:linear-gradient(90deg,${color}40,transparent)`
  },
  // CHAPTER 标签
  chapterLabel: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;`
         + `color:${color}90;font-family:system-ui,-apple-system,sans-serif`
  },
  // 内容区域（包含大号装饰数字和文字）
  content: 'position:relative;padding-left:80px',
  // 左侧大号装饰数字
  decoNum: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `position:absolute;left:0;top:-12px;font-size:96px;font-weight:900;`
         + `color:${color}12;line-height:1;font-family:system-ui,-apple-system,sans-serif;`
         + `pointer-events:none;user-select:none`
  },
  // 标题文字
  title: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `margin:0px;font-size:28px;font-weight:900;color:rgb(17,24,39);`
         + `line-height:1.3;letter-spacing:-0.5px;font-family:system-ui,-apple-system,sans-serif`
  },
  // 副标题
  subtitle: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `margin:8px 0px 0px;font-size:12px;font-weight:600;letter-spacing:2px;`
         + `text-transform:uppercase;color:${color};font-family:system-ui,-apple-system,sans-serif`
  },
}

// ── 组件定义 ──────────────────────────────────────────
export const ParagraphTitle_DA01 = {
  id: 'ParagraphTitle_DA01',
  name: '段落标题',
  tag: 'p-title',
  attrs: [
    { key: 'num',      label: '序号（01/02）', required: true, default: '01' },
    { key: 'subtitle', label: '副标题',        required: false, default: '' },
    { key: 'color',    label: '自定义颜色',    required: false, default: '' },
  ],
  example:
    `<p-title num="01" subtitle="PARAGRAPH TITLE · 分段标题">段落标题组件</p-title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const num = attrs.num || '01'
    const subtitle = attrs.subtitle
    const accent = t.accent
    const color = attrs.color || accent

    // 顶部横线 + CHAPTER 标签
    const topLine = `
      <div style="${S.topLine(accent, attrs.color)}">
        <span style="${S.chapterLabel(accent, attrs.color)}">CHAPTER ${num}</span>
        <div style="${S.line(accent, attrs.color)}"></div>
      </div>`

    // 大号装饰数字
    const decoNum = `<span style="${S.decoNum(accent, attrs.color)}">${num}</span>`

    // 标题文字
    const titleText = `<h2 style="${S.title(accent, attrs.color)}">${leaf(body)}</h2>`

    // 副标题（如果有）
    const subtitleText = subtitle
      ? `<p style="${S.subtitle(accent, attrs.color)}">${leaf(subtitle)}</p>`
      : ''

    return `
      <section style="${S.wrapper(accent, attrs.color)}">
        ${topLine}
        <div style="${S.content}">
          ${decoNum}
          ${titleText}
          ${subtitleText}
        </div>
      </section>`
  },
}
