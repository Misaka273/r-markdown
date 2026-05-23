import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * Lead_DA01 - 引导文字（默认A型01号样式）
 *
 * 编辑器语法：
 *   <lead>这是一段引导文字，用来引入话题或提供背景信息。</lead>
 *
 * 属性：
 *   color - 左侧边框颜色（可选，默认使用主题色）
 *
 * body 内容带左侧边框，适合引入话题或提供背景信息。
 * 视觉效果比普通段落更突出，但又不会像 Statement 那样过于正式。
 */

export const Lead_DA01 = {
  id: 'Lead_DA01',
  name: '引导文字',
  tag: 'lead',
  attrs: [{ key: 'color', label: '边框颜色', required: false, default: '' }],
  example: `<lead>在开始之前，先聊一个背景：最近几年，越来越多的人开始重新审视自己的生活方式。</lead>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const color = attrs.color || t.accent
    return `<section><p style="font-size:16px;color:rgb(85,85,85);line-height:1.8;padding:16px 0px;border-left:3px solid ${color};padding-left:16px;margin:14px 0px">${leaf(body)}</p></section>`
  },
}
