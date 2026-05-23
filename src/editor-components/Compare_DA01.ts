/**
 * Compare_DA01 - 左右对比（默认A型01号样式）
 *
 * 编辑器语法：
  *   <compare left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版">
 *   <left>
 *   左侧内容（支持图片、文字等）
 *   </left>
 *   <right>
 *   右侧内容（支持图片、文字等）
 *   </right>
 *   </compare>
 *
 * 属性：
 *   left-label  - 左侧标签（如 BEFORE）
 *   left-title  - 左侧标题
 *   right-label - 右侧标签（如 AFTER）
 *   right-title - 右侧标题
 *   color       - 自定义颜色（默认使用主题色）
 *   direction   - 布局方向：horizontal（默认）/ vertical（竖向）
 */
import { leaf } from '@/utils/helpers'
import { resolveColor } from '@/utils/colorUtils'
import type { ThemeColors } from '@/composables/useTheme'

export const Compare_DA01 = {
  id: 'Compare_DA01',
  name: '左右对比',
  tag: 'compare',
    attrs: [
    { key: 'left-label',  label: '左侧标签',  required: false, default: '' },
    { key: 'left-title',  label: '左侧标题',  required: false, default: '' },
    { key: 'right-label', label: '右侧标签',  required: false, default: '' },
    { key: 'right-title', label: '右侧标题',  required: false, default: '' },
    { key: 'color',       label: '自定义颜色', required: false, default: '' },
    { key: 'direction',   label: '布局方向',   required: false, default: 'horizontal', options: ['horizontal', 'vertical'] },
  ],
  example:
    `<compare left-label="BEFORE" left-title="旧版绿色" right-label="AFTER" right-title="新版靛青">
<left>
![旧版](https://robocopmao.github.io/r-markdown/banner1.webp)[100% 120px]
</left>
<right>
![新版](https://robocopmao.github.io/r-markdown/banner2.webp)[100% 120px]
</right>
</compare>` + '\n\n' +
    `<compare left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版" direction="vertical">
<left>
旧版内容：界面简单，功能较少，适合轻量使用场景。
</left>
<right>
新版内容：全新设计，功能丰富，支持多种高级特性。
</right>
</compare>`,

  parseSides(body: string): { left: string; right: string } {
    const leftMatch = body.match(/<left>([\s\S]*?)<\/left>/)
    const rightMatch = body.match(/<right>([\s\S]*?)<\/right>/)
    return {
      left: leftMatch ? leftMatch[1].trim() : '',
      right: rightMatch ? rightMatch[1].trim() : '',
    }
  },

    render(
    attrs: Record<string, string>,
    body: string,
    t: ThemeColors,
    inlineRenderer?: (md: string) => string,
  ): string {
    const hex = resolveColor(attrs.color || t.accent)
    const direction = attrs.direction || 'horizontal'
    const isVertical = direction === 'vertical'
    const { left, right } = this.parseSides(body)

    const renderContent = (md: string): string => {
      if (!md) return ''
      if (inlineRenderer) return inlineRenderer(md)
      return md.replace(
        /!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/g,
        (_, alt, src, size) => {
          if (size) {
            const parts = size.split(/\s+/)
            return `<img src="${src}" alt="${alt}" style="width:${parts[0] || '100%'};max-height:${parts[1] || '120px'};border-radius:6px;display:block">`
          }
          return `<img src="${src}" alt="${alt}" style="width:100%;max-height:120px;border-radius:6px;display:block">`
        }
      )
    }

    const renderSide = (label: string, title: string, content: string, labelColor: string): string => {
      let html = ''
      if (label) {
        html += `<p style="margin:0px 0px 4px;font-size:10px;font-weight:700;color:${labelColor};letter-spacing:2px"><span leaf="">${leaf(label)}</span></p>`
      }
      if (title) {
        html += `<p style="margin:0px 0px 8px;font-size:14px;font-weight:700;color:rgb(51,65,85)"><span leaf="">${leaf(title)}</span></p>`
      }
      html += renderContent(content)
      return html
    }

    if (isVertical) {
      // ── 竖向布局 ──
      return `<section style="display:flex;flex-direction:column;gap:12px;margin:20px 0px"><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, 'rgb(153,153,153)')}</section><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
    }

    // ── 横向布局（默认）──
    return `<section style="display:flex;gap:16px;margin:20px 0px"><section style="flex:1;min-width:0;padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, 'rgb(153,153,153)')}</section><section style="flex:1;min-width:0;padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
  },
}
