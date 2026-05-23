/**
 * Compare_DA02 - 纵向对比（默认A型02号样式）
 *
 * 与 DA01 的区别：
 *   DA01 = 横向左右对比（flex row）
 *   DA02 = 纵向上下对比（flex column）
 *
 * 编辑器语法：
 *   <compare type="DA02" left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版">
 *   <left>旧版内容</left>
 *   <right>新版内容</right>
 *   </compare>
 */
import { leaf } from '@/utils/helpers'
import { resolveColor } from '@/utils/colorUtils'
import type { ThemeColors } from '@/composables/useTheme'

export const Compare_DA02 = {
  id: 'Compare_DA02',
  name: '对比',
  tag: 'compare',
  attrs: [
    { key: 'left-label', label: '左侧标签', required: false, default: '' },
    { key: 'left-title', label: '左侧标题', required: false, default: '' },
    { key: 'right-label', label: '右侧标签', required: false, default: '' },
    { key: 'right-title', label: '右侧标题', required: false, default: '' },
    { key: 'color', label: '自定义颜色', required: false, default: '' },
  ],
  example: `<compare type="DA02" left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版">
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
    const { left, right } = this.parseSides(body)

    const renderContent = (md: string): string => {
      if (!md) return ''
      if (inlineRenderer) return inlineRenderer(md)
      return md.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/g, (_, alt, src, size) => {
        if (size) {
          const parts = size.split(/\s+/)
          return `<img src="${src}" alt="${alt}" style="width:${parts[0] || '100%'};max-height:${parts[1] || '120px'};border-radius:6px;display:block">`
        }
        return `<img src="${src}" alt="${alt}" style="width:100%;max-height:120px;border-radius:6px;display:block">`
      })
    }

    const renderSide = (
      label: string,
      title: string,
      content: string,
      labelColor: string,
    ): string => {
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

    // 纵向布局
    return `<section style="display:flex;flex-direction:column;gap:12px;margin:20px 0px"><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, 'rgb(153,153,153)')}</section><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
  },
}
