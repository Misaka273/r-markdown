import { leaf } from '@/utils/helpers'
import type { ThemeColors } from '@/composables/useTheme'

/**
 * Steps_DA01 - 横向步骤流（默认A型01号样式）
 *
 * 编辑器语法：
 *   ::: steps label="HOW IT WORKS" title="标题" hint="提示文字" active="2" color="#e74c3c"
 *   - 步骤名称 | 步骤描述
 *   - 步骤名称 | 步骤描述
 *   :::
 *
 * 属性：
 *   label  - 顶部标签（如：HOW IT WORKS）
 *   title  - 标题
 *   hint   - 提示文字
 *   active - 当前激活步骤（从1开始）
 *   color  - 自定义颜色（默认使用主题色）
 */

export const Steps_DA01 = {
  id: 'Steps_DA01',
  name: '横向步骤流',
  tag: 'steps',
  attrs: [
    { key: 'label',  label: '顶部标签',         required: false, default: '' },
    { key: 'title',  label: '标题',             required: false, default: '' },
    { key: 'hint',   label: '提示文字',         required: false, default: '' },
    { key: 'active', label: '当前步骤（1/2/3）', required: false, default: '1' },
    { key: 'color',  label: '自定义颜色',       required: false, default: '' },
  ],
    example:
    `::: steps label="HOW IT WORKS" title="安装好之后怎么跑起来" hint="左右滑动查看" active="2" color="#e74c3c"
- 输入 | 往知识库里喂东西
- 管理 | 让知识库有序运转
- 输出 | 从知识库取素材做东西
:::`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const active = parseInt(attrs.active || '1', 10)
    const color = attrs.color || t.accent

    // 解析步骤列表
    const steps: { name: string; desc: string }[] = []
    body.split('\n').forEach((line) => {
      const m = line.trim().match(/^-\s*(.+)\s*\|\s*(.+)/)
      if (m) steps.push({ name: m[1].trim(), desc: m[2].trim() })
    })

    let html = `<section style="margin:0px 0px 24px;padding:40px 20px;background:rgb(250,251,254);border-radius:12px;border:1px solid rgb(238,238,238)">`
    if (attrs.label)
      html += `<p style="margin:0px 0px 4px;font-size:10px;color:rgb(153,153,153);letter-spacing:2px;font-weight:700">${leaf(attrs.label)}</p>`
    if (attrs.title)
      html += `<p style="margin:0px 0px 4px;font-size:18px;font-weight:800;color:rgb(26,26,26)">${leaf(attrs.title)}</p>`
    if (attrs.hint)
      html += `<p style="margin:0px 0px 16px;font-size:12px;color:rgb(153,153,153)">${leaf(attrs.hint)}</p>`
    html += `<section style="display:flex;gap:12px;overflow-x:auto">`
    steps.forEach((s, idx) => {
      const isActive = idx + 1 === active
      const itemStyle = isActive
        ? `flex:1;min-width:100px;padding:16px 12px;background:${color}10;border-radius:10px;border:2px solid ${color};text-align:center;position:relative`
        : `flex:1;min-width:100px;padding:16px 12px;background:rgb(255,255,255);border-radius:10px;border:1px solid rgb(238,238,238);text-align:center;position:relative`
      html += `<section style="${itemStyle}">`
      html += `<p style="margin:0px 0px 4px;font-size:20px;font-weight:900;color:${color}">${leaf(idx + 1)}</p>`
      html += `<p style="margin:0px 0px 2px;font-size:13px;font-weight:700;color:rgb(51,65,85)">${leaf(s.name)}</p>`
      html += `<p style="margin:0px;font-size:11px;color:rgb(153,153,153)">${leaf(s.desc)}</p>`
      html += `</section>`
    })
    html += `</section></section>`
    return html
  },
}
