import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * D001 - 标题卡片
 *
 * 编辑器语法（类 HTML 标签）：
 *   <title badge="GUIDE" subtitle="副标题" chips="关键词1|关键词2">文章标题</title>
 *
 * 属性：
 *   badge    - 分类标签（如：GUIDE、更新、教程）
 *   subtitle - 副标题
 *   chips    - 关键词标签，| 分隔
 *
 * 渲染输出：带阴影、渐变背景、阅读时间估算的卡片
 */
export const D001_title = {
  id: 'D001',
  name: '标题卡片',
  tag: 'title',
  attrs: [
    { key: 'badge', label: '标签', required: false, default: '' },
    { key: 'subtitle', label: '副标题', required: false, default: '' },
    { key: 'chips', label: '关键词（|分隔）', required: false, default: '' },
  ],
  example: `<title badge="GUIDE" subtitle="这是一份包含所有可用 Markdown 指令及扩展标签的完整演示稿。" chips="图片并排|窗口滚动|渐变文字">功能全集：排版组件指南</title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors, raw: string = ''): string {
    const cleanText = raw
      .replace(/<title[\s\S]*?<\/title>\s*/, '')
      .replace(/[#*`>[\]!|_~=-]/g, '')
      .replace(/\s+/g, '')
    const charCount = cleanText.length
    const readMin = Math.max(1, Math.ceil(charCount / 400))

    let html = `<section style="margin:0px 0px 30px;box-shadow:rgba(15,23,42,0.05) 0px 10px 24px;border-radius:14px;border:1px solid rgba(229,231,235,0.9);overflow:hidden;background:linear-gradient(135deg,rgb(248,250,252) 0%,rgb(238,244,251) 100%)">`
    html += `<section style="padding:20px;background:rgba(255,255,255,0.92)">`
    html += `<div class="tableWrapper"><table style="border:0px;border-collapse:collapse;table-layout:fixed;min-width:115px;width:100%;margin-bottom:0"><colgroup><col><col style="width:90px;"></colgroup><tbody><tr>`
    html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left">`

    if (attrs.badge)
      html += `<p style="margin:0px;padding:0px 0px 10px;font-size:10px;color:${t.accent};letter-spacing:2.4px;text-transform:uppercase;font-weight:800">${leaf(attrs.badge)}</p>`
    if (body)
      html += `<p style="margin:0px;font-size:28px;font-weight:900;color:rgb(17,24,39);line-height:1.2;letter-spacing:-0.5px;word-break:break-all">${leaf(body)}</p>`
    if (attrs.subtitle)
      html += `<p style="margin:0px;padding:10px 0px 0px;font-size:14px;color:rgb(71,85,105);line-height:1.7;font-weight:400">${leaf(attrs.subtitle)}</p>`
    if (attrs.chips) {
      html += `<section style="margin:0px;padding:10px 0px 0px;font-size:0px;line-height:1.8">`
      attrs.chips.split('|').forEach((c: string) => {
        html += `<span style="display:inline-block;margin:0px 8px 0px 0px;font-size:10px;color:#576B95;font-weight:700;letter-spacing:0.02em;white-space:nowrap">${leaf('#' + c.trim())}</span>`
      })
      html += `</section>`
    }

    html += `</td>`
    html += `<td data-colwidth="90" width="90" valign="top" align="right" style="vertical-align:top;border:0px;padding:0px;text-align:right">`
    html += `<p style="margin:0px 0px 8px;font-size:10px;line-height:1.2;color:rgb(148,163,184);font-weight:800;letter-spacing:0.4px">${leaf('预计阅读(分)')}</p>`
    html += `<section style="display:inline-block;width:64px;height:64px;line-height:64px;text-align:center;border-radius:10px;background-color:${t.accent};box-shadow:rgba(15,23,42,0.16) 0px 12px 24px"><span style="font-size:30px;line-height:64px;color:rgb(255,255,255);font-weight:900;letter-spacing:-1px">${leaf(readMin)}</span></section>`
    html += `<p style="margin:8px 0px 0px;font-size:10px;color:rgb(148,163,184);font-weight:700;letter-spacing:0.3px">${leaf('共 ' + charCount + ' 字')}</p>`
    html += `</td>`
    html += `</tr></tbody></table></div>`
    html += `</section></section>`
    return html
  },
}
