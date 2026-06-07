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
import { leaf, esc, parseAttrs } from '@/utils/helpers'
import { resolveColor } from '@/utils/colorUtils'
import { Img_DA01 } from '@/editor-components/Img_DA01'
import type { ThemeColors } from '@/composables/useTheme'

export const Compare_DA02 = {
  id: 'Compare_DA02',
  name: '对比',
  tag: 'compare',
  attrs: [
    {
      key: 'left-label',
      label: '左侧标签',
      required: false,
      default: '',
      description: '左侧列标签，如「A 方案」',
    },
    {
      key: 'left-title',
      label: '左侧标题',
      required: false,
      default: '',
      description: '左侧列标题或描述',
    },
    {
      key: 'right-label',
      label: '右侧标签',
      required: false,
      default: '',
      description: '右侧列标签，如「B 方案」',
    },
    {
      key: 'right-title',
      label: '右侧标题',
      required: false,
      default: '',
      description: '右侧列标题或描述',
    },
    {
      key: 'color',
      label: '自定义颜色',
      required: false,
      default: '',
      description: '自定义颜色，填入 CSS 颜色值覆盖默认主题色，使用颜色单词或十六进制颜色值',
    },
  ],
  example: `<compare type="DA02" left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版">
<left>
旧版界面设计较为传统
![旧版](https://picsum.photos/400/120?random=5)[100% 120px]
交互体验一般
</left>
<right>
新版采用全新设计语言
![新版](https://picsum.photos/400/120?random=6)[100% 120px]
用户体验大幅提升
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
      const lines = md.split('\n').filter((l) => l.trim())
      return lines
        .map((line) => {
          const trimmed = line.trim()
          // 自定义 img 标签（如 <img src="..." width="100%" height="200px" radius="8px" fit="cover" />）
          const customImgMatch = trimmed.match(/^<img\s+(.*?)\s*\/?\s*>$/)
          if (customImgMatch) {
            const imgAttrs = parseAttrs(customImgMatch[1])
            return Img_DA01.render(imgAttrs, '', t, '12px')
          }
          // 图片行（markdown 语法）
          const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?$/)
          if (imgMatch) {
            const [, alt, src, size] = imgMatch
            if (size) {
              const parts = size.split(/\s+/)
              return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:${parts[0] || '100%'};max-height:${parts[1] || '120px'};border-radius:6px;display:block;margin:6px 0">`
            }
            return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:100%;max-height:120px;border-radius:6px;display:block;margin:6px 0">`
          }
          // 文字行
          const rendered = inlineRenderer ? inlineRenderer(trimmed) : leaf(trimmed)
          return `<p style="margin:4px 0;font-size:14px;color:rgb(100,116,139);line-height:1.6">${rendered}</p>`
        })
        .join('')
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
    return `<section style="display:flex;flex-direction:column;gap:12px;margin:24px 0px"><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, 'rgb(153,153,153)')}</section><section style="padding:16px;background:rgb(250,251,254);border-radius:12px">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
  },
}
