/**
 * CaseFlow_DA01 - 实践案例流（默认A型01号样式）
 *
 * 编辑器语法：
 *   - [案例 01] 案例描述内容
 *   - [案例 02] 案例描述内容
 *
 * 渲染效果：
 *   ┌─────────────────────────────────────────┐
 *   │ [案例 01]  案例描述内容                  │
 *   └─────────────────────────────────────────┘
 *
 * 属性：
 *   color?: string  - 标签背景色（默认 #e74c3c 红色）
 */
import type { ThemeColors } from '@/composables/useTheme'

interface CaseItem {
  num: string
  text: string
}

function parseCaseItems(body: string): CaseItem[] {
  const items: CaseItem[] = []
  const lines = body.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const m = line.match(/^-\s*\[案例\s*(\d+)\]\s*(.+)$/)
    if (m) {
      items.push({ num: m[1], text: m[2].trim() })
    }
  }
  return items
}

export const CaseFlow_DA01 = {
  id: 'CaseFlow_DA01',
  name: '实践案例流',
  tag: 'case-flow',

  render(
    attrs: Record<string, string>,
    body: string,
    t: ThemeColors
  ): string {
    const color = attrs.color || '#e74c3c'
    const items = parseCaseItems(body)

    if (items.length === 0) return ''

    const rows = items.map(item => `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
        <span style="flex-shrink:0;background:${color};color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:4px;letter-spacing:0.5px;">案例 ${item.num}</span>
        <span style="flex:1;font-size:15px;line-height:1.6;color:#333;">${item.text}</span>
      </div>
    `).join('')

    return `
      <div style="margin:20px 0;padding:0 16px;">
        ${rows}
      </div>
    `
  }
}
