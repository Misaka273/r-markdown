import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * PTitle - 段落标题（默认A型01号样式）
 *
 * 编辑器语法（两种写法均可）：
 *   <p-title num="01" title="标题内容" subtitle="副标题" level="1"></p-title>
 *   <p-title num="01" title="标题内容" level="2"></p-title>
 *   <p-title num="01">标题内容</p-title>  ← body 作为 fallback
 *
 * Markdown 语法（自动转换）：
 *   # 一级标题文字       → level=1
 *   ## 二级标题文字      → level=2
 *   ### 三级标题文字     → level=3
 *   #### 四级标题文字    → level=4
 *
 * 属性：
 *   num             - 序号，如 01、02（可选）
 *   title           - 标题文字（可选，优先于 body 内容）
 *   subtitle        - 副标题文字（可选）
 *   color           - 标题文字颜色（可选，默认 rgb(17,24,39)）
 *   num-color       - 序号数字颜色（可选，默认使用主题色）
 *   subtitle-color  - 副标题颜色（可选，默认使用主题色）
 *   level           - 层级：1=一级标题(#)，2=二级标题(##)，3=三级标题(###)，4=四级标题(####)
 *   prefix          - 标题前缀图标，如 🚀、⚡、🔥（可选）
 *   suffix          - 标题后缀图标，如 ✅、💡、→（可选）
 */

// ── 组件定义 ──────────────────────────────────────────
export const PTitle = {
  id: 'PTitle',
  name: '段落标题',
  tag: 'p-title',
  attrs: [
    { key: 'num',             label: '序号（01/02）', required: false, default: '' },
    { key: 'title',           label: '标题文字',      required: false, default: '' },
    { key: 'subtitle',        label: '副标题',        required: false, default: '' },
    { key: 'color',           label: '标题颜色',      required: false, default: '' },
    { key: 'num-color',       label: '序号颜色',      required: false, default: '' },
    { key: 'subtitle-color',  label: '副标题颜色',    required: false, default: '' },
    { key: 'level',           label: '层级（1/2/3/4）', required: false, default: '1' },
    { key: 'prefix',          label: '前缀图标',      required: false, default: '' },
    { key: 'suffix',          label: '后缀图标',      required: false, default: '' },
  ],
  example:
    `<p-title num="01" title="段落标题组件" subtitle="PARAGRAPH TITLE · 分段标题" level="1"></p-title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const num = attrs.num || ''
    const title = attrs.title || body  // title 属性优先，fallback 到 body
    const subtitle = attrs.subtitle
    const level = parseInt(attrs.level || '1', 10)
    const accent = t.accent
    const titleColor = attrs.color || 'rgb(17,24,39)'
    const numColor = attrs['num-color'] || accent
    const subtitleColor = attrs['subtitle-color'] || accent
    const hasNum = num !== ''
    const prefix = attrs.prefix || ''
    const suffix = attrs.suffix || ''
    const hasPrefix = prefix !== ''
    const hasSuffix = suffix !== ''

    // ── Level 1: 完整章节标题（CHAPTER + 大号装饰数字 + 标题 + 副标题）──
    if (level === 1) {
      const numBlock = hasNum
                ? `<strong style="display:block;font-size:60px;line-height:1;color:${numColor};letter-spacing:-3px;white-space:nowrap;opacity:0.25"><span leaf="">${num}</span></strong>`
        : ''
      const titleBlock = hasNum
        ? `<strong style="display:block;font-size:30px;font-weight:900;color:${titleColor};line-height:1.26;letter-spacing:-0.8px;margin-top:-60px;margin-left:50px"><span leaf="">${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}</span></strong>`
        : `<strong style="display:block;font-size:30px;font-weight:900;color:${titleColor};line-height:1.26;letter-spacing:-0.8px"><span leaf="">${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}</span></strong>`
      const subtitleHtml = subtitle
        ? `<span style="display:block;margin-left:${hasNum ? '50px' : '0'};font-size:11px;color:${subtitleColor};font-weight:700;text-transform:uppercase;letter-spacing:1.6px"><span leaf="">${leaf(subtitle)}</span></span>`
        : ''
      const chapterLine = hasNum
        ? `<section style="display:flex;align-items:center;margin:0;padding-bottom:12px"><span style="font-size:10px;font-weight:800;color:rgb(148,163,184);letter-spacing:2.6px;text-transform:uppercase;white-space:nowrap"><span leaf="">CHAPTER ${num}</span></span><section style="flex:1;border-top:1px solid rgb(229,231,235);margin:0 0 0 12px;height:0"></section></section>`
        : ''

      return `
<section style="margin:48px 0px 30px">
  <section style="clear:both">
    ${chapterLine}
    <section style="margin:0">
      ${numBlock}
      ${titleBlock}
      ${subtitleHtml}
    </section>
  </section>
</section>`
    }

    // ── Level 2: 二级标题（##）──
    if (level === 2) {
      const titleText = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
      if (hasNum) {
        return `
<section style="margin:36px 0px 20px">
  <p style="margin:0px;display:flex;align-items:baseline;gap:10px"><strong style="font-size:24px;font-weight:900;color:${numColor};line-height:1.4;letter-spacing:-0.3px;flex-shrink:0"><span leaf="">${num}</span></strong><span style="font-size:24px;font-weight:800;color:${titleColor};line-height:1.4;letter-spacing:-0.3px"><span leaf="">${titleText}</span></span></p>
</section>`
      }
      return `
<section style="margin:36px 0px 20px">
  <p style="margin:0px;font-size:24px;font-weight:800;color:${titleColor};line-height:1.4;letter-spacing:-0.3px"><span leaf="">${titleText}</span></p>
</section>`
    }

    // ── Level 3: 三级标题（###）──
    if (level === 3) {
      const titleText3 = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
      if (hasNum) {
        return `
<section style="margin:28px 0px 16px">
  <p style="margin:0px;display:flex;align-items:baseline;gap:8px"><strong style="font-size:20px;font-weight:900;color:${numColor};line-height:1.45;flex-shrink:0"><span leaf="">${num}</span></strong><span style="font-size:20px;font-weight:700;color:${titleColor};line-height:1.45"><span leaf="">${titleText3}</span></span></p>
</section>`
      }
      return `
<section style="margin:28px 0px 16px">
  <p style="margin:0px;font-size:20px;font-weight:700;color:${titleColor};line-height:1.45"><span leaf="">${titleText3}</span></p>
</section>`
    }

    // ── Level 4: 四级标题（####）──
    const titleText4 = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
    if (hasNum) {
      return `
<section style="margin:24px 0px 12px">
  <p style="margin:0px;display:flex;align-items:baseline;gap:8px"><strong style="font-size:16px;font-weight:900;color:${numColor};line-height:1.5;flex-shrink:0"><span leaf="">${num}</span></strong><span style="font-size:16px;font-weight:700;color:${titleColor};line-height:1.5"><span leaf="">${titleText4}</span></span></p>
</section>`
    }
    return `
<section style="margin:24px 0px 12px">
  <p style="margin:0px;font-size:16px;font-weight:700;color:${titleColor};line-height:1.5"><span leaf="">${titleText4}</span></p>
</section>`
  },
}
