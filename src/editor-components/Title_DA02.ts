import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * Title_DA02 - 标题卡片（默认A型02号样式）
 *
 * 编辑器语法：
 *   <title badge="GUIDE" subtitle="副标题" chips="关键词1|关键词2">文章标题</title>
 *
 * 与 DA01 的区别：
 *   阅读统计（预计阅读x分钟 共xx字）展示在 badge 后面，而非右侧独立区域
 *
 * 属性：
 *   badge    - 分类标签（如：GUIDE、更新、教程）
 *   subtitle - 副标题
 *   chips    - 关键词标签，| 分隔
 */

// ── 样式常量 ──────────────────────────────────────────
const S = {
  card:    'margin:0px 0px 30px;box-shadow:rgba(15,23,42,0.05) 0px 10px 24px;'
         + 'border-radius:14px;border:1px solid rgba(229,231,235,0.9);'
         + 'overflow:hidden;background:linear-gradient(135deg,rgb(248,250,252) 0%,rgb(238,244,251) 100%)',
  body:    'padding:20px;background:rgba(255,255,255,0.92)',
  badgeRow:'margin:0px 0px 10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap',
  badge:   (color: string) =>
             `margin:0px;padding:0px;font-size:10px;color:${color};`
           + 'letter-spacing:2.4px;text-transform:uppercase;font-weight:800',
    stat:    'margin:0px;font-size:10px;color:rgb(148,163,184);'
         + 'font-weight:700;letter-spacing:0.3px;line-height:1',
  statNum: (color: string) =>
             `font-size:12px;font-weight:900;color:${color}`,
  title:   'margin:0px;font-size:28px;font-weight:900;color:rgb(17,24,39);'
         + 'line-height:1.2;letter-spacing:-0.5px;word-break:break-all',
  subtitle:'margin:0px;padding:10px 0px 0px;font-size:14px;color:rgb(71,85,105);'
         + 'line-height:1.7;font-weight:400',
  chips:   'margin:0px;padding:10px 0px 0px;font-size:0px;line-height:1.8',
  chip:    'display:inline-block;margin:0px 8px 0px 0px;font-size:10px;'
         + 'color:#576B95;font-weight:700;letter-spacing:0.02em;white-space:nowrap',
}

// ── 辅助函数 ──────────────────────────────────────────
function countChars(raw: string): { chars: number; minutes: number } {
  const text = raw
    .replace(/<title[\s\S]*?<\/title>\s*/, '')
    .replace(/[#*`>[\]!|_~=-]/g, '')
    .replace(/\s+/g, '')
  const chars = text.length
  return { chars, minutes: Math.max(1, Math.ceil(chars / 400)) }
}

function renderChips(raw: string): string {
  return raw
    .split('|')
    .map(c => `<span style="${S.chip}">${leaf('#' + c.trim())}</span>`)
    .join('')
}

// ── 组件定义 ──────────────────────────────────────────
export const Title_DA02 = {
  id: 'Title_DA02',
  name: '标题卡片B',
      tag: 'title',
    attrs: [
    { key: 'type',     label: '样式类型（DA01/DA02）', required: false, default: 'DA02' },
    { key: 'badge',    label: '标签',           required: false, default: '' },
    { key: 'subtitle', label: '副标题',         required: false, default: '' },
    { key: 'chips',    label: '关键词（|分隔）', required: false, default: '' },
  ],
  example:
    `<title badge="GUIDE" subtitle="这是一份包含所有可用 Markdown 指令及扩展标签的完整演示稿。" chips="图片并排|窗口滚动|渐变文字">功能全集：排版组件指南</title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors, raw: string = ''): string {
    const { chars, minutes } = countChars(raw)

    // badge 行：badge + 阅读统计
    const badgeHtml = attrs.badge
      ? `<span style="${S.badge(t.accent)}">${leaf(attrs.badge)}</span>`
      : ''
        const statHtml = `<span style="${S.stat}">${leaf('预计阅读 ')}<span style="${S.statNum(t.accent)}">${leaf(minutes)}</span>${leaf(` 分钟 · 共 ${chars} 字`)}</span>`

    return `
      <section style="${S.card}">
        <section style="${S.body}">
          <section style="${S.badgeRow}">
            ${badgeHtml}
            ${statHtml}
          </section>
          ${body ? `<p style="${S.title}">${leaf(body)}</p>` : ''}
          ${attrs.subtitle ? `<p style="${S.subtitle}">${leaf(attrs.subtitle)}</p>` : ''}
          ${attrs.chips ? `<section style="${S.chips}">${renderChips(attrs.chips)}</section>` : ''}
        </section>
      </section>`
  },
}
