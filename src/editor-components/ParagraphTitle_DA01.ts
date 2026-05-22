import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * ParagraphTitle_DA01 - 段落标题（默认A型01号样式）
 *
  * 编辑器语法：
 *   <p-title icon="🔥" num="01">标题文字</p-title>
 *   <p-title color="#FF6B35">标题文字</p-title>
 *
 * 属性：
 *   icon  - 左侧图标/emoji（可选）
 *   num   - 序号，如 01、02（可选，与 icon 二选一）
 *   color - 自定义颜色（可选，默认使用主题色）
 */

// ── 样式常量 ──────────────────────────────────────────
const S = {
  wrapper: (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `margin:36px 0px 16px;padding:0px 0px 0px 14px;`
         + `border-left:4px solid ${color}`
  },
  inner:  'margin:0px;padding:0px',
  icon:   (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `display:inline-block;margin-right:8px;font-size:20px;`
         + `vertical-align:middle;line-height:1`
  },
  num:    (accent: string, customColor?: string) => {
    const color = customColor || accent
    return `display:inline-block;margin-right:10px;padding:2px 10px;`
         + `font-size:12px;font-weight:800;letter-spacing:1px;`
         + `color:${color};background:${color}14;`
         + `border-radius:4px;vertical-align:middle`
  },
  text:   'margin:0px;font-size:20px;font-weight:800;color:rgb(17,24,39);'
        + 'line-height:1.4;letter-spacing:-0.3px;vertical-align:middle',
}

// ── 组件定义 ──────────────────────────────────────────
export const ParagraphTitle_DA01 = {
  id: 'ParagraphTitle_DA01',
  name: '段落标题',
    tag: 'p-title',
  attrs: [
    { key: 'icon',  label: '图标/emoji',  required: false, default: '' },
    { key: 'num',   label: '序号（01/02）', required: false, default: '' },
    { key: 'color', label: '自定义颜色',   required: false, default: '' },
  ],
  example:
        `<p-title icon="🔥" num="01">段落标题文字</p-title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const prefix = attrs.icon
      ? `<span style="${S.icon(t.accent, attrs.color)}">${leaf(attrs.icon)}</span>`
      : attrs.num
        ? `<span style="${S.num(t.accent, attrs.color)}">${leaf(attrs.num)}</span>`
        : ''

    return `
      <section style="${S.wrapper(t.accent, attrs.color)}">
        <section style="${S.inner}">
          <p style="${S.text}">${prefix}${leaf(body)}</p>
        </section>
      </section>`
  },
}
