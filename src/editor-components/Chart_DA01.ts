/**
 * Chart_DA01 - 图表组件（柱状图 / 折线图 / 饼状图）
 *
 * 编辑器语法：
 *   <chart type="bar" labels="Q1,Q2,Q3,Q4" values="30,50,20,80"></chart>
 *   <chart type="line" labels="1月,2月,3月,4月" values="30,50,20,80"></chart>
 *   <chart type="pie" labels="产品A,产品B,产品C" values="30,50,20"></chart>
 *
 * 属性：
 *   type   - 图表类型：bar=柱状图 / line=折线图 / pie=饼状图
 *   labels - 标签列表，逗号分隔
 *   values - 数值列表，逗号分隔
 *   width  - SVG 宽度（默认 800）
 *   height - SVG 高度（默认 400，饼状图 350）
 *   title  - 图表标题（可选）
 *   colors - 自定义颜色，逗号分隔（可选，默认从主题色生成渐变色板）
 */
import { leaf, esc } from '@/utils/helpers'
import { resolveColor } from '@/utils/colorUtils'
import type { ThemeColors } from '@/composables/useTheme'

/** 将 hex 颜色转为 hsl，用于生成渐变色板 */
function hexToHSL(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0
  const h = hex.replace('#', '')
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16)
    g = parseInt(h[1] + h[1], 16)
    b = parseInt(h[2] + h[2], 16)
  } else {
    r = parseInt(h.substring(0, 2), 16)
    g = parseInt(h.substring(2, 4), 16)
    b = parseInt(h.substring(4, 6), 16)
  }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hue = 0, sat = 0
  const lum = (max + min) / 2
  if (max !== min) {
    const d = max - min
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: hue = ((b - r) / d + 2) / 6; break
      case b: hue = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(hue * 360), Math.round(sat * 100), Math.round(lum * 100)]
}

/** 从主色生成颜色板 (8色) */
function generatePalette(accent: string, count: number): string[] {
  const [h, s, l] = hexToHSL(accent)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = (h + (i * 360) / count) % 360
    const sat = Math.max(30, s - i * 3)
    const lum = Math.max(25, Math.min(60, l - 5 + i * 5))
    result.push(`hsl(${hue},${sat}%,${lum}%)`)
  }
  return result
}

/** Cardinal 样条——将折线点转为平滑贝塞尔 path d */
function smoothLinePath(points: { x: number; y: number }[], tension = 0.3): string {
  const n = points.length;
  if (n < 2) return '';
  const parts: string[] = [`M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`];
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < n - 2 ? points[i + 2] : points[n - 1];
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
    parts.push(`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  }
  return parts.join(' ');
}

/** 饼状图 - 计算扇形 path */
function pieSlicePath(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`
}

export const Chart_DA01 = {
  id: 'Chart_DA01',
  name: '图表',
  tag: 'chart',
  attrs: [
    {
      key: 'type',
      label: '图表类型',
      required: true,
      default: 'bar',
      options: ['bar', 'line', 'pie', 'scatter'],
      description: 'bar=柱状图 / line=折线图 / pie=饼状图 / scatter=散点图',
    },
    {
      key: 'labels',
      label: '数据标签',
      required: true,
      default: '',
      description: '标签列表，逗号分隔，如 "Q1,Q2,Q3,Q4"。散点图可省略',
    },
    {
      key: 'values',
      label: '数据值',
      required: true,
      default: '',
      description: '数值列表，逗号分隔。多组用分号分隔，如 "30,50,20;25,40,35"；散点图多组使用|分隔，如 "1,10;2,30|1.2,3;3.1,20"',
    },
    {
      key: 'width',
      label: '宽度',
      required: false,
      default: '375',
      description: 'SVG 宽度（像素）',
    },
    {
      key: 'height',
      label: '高度',
      required: false,
      default: '',
      description: 'SVG 高度（像素），不填则自动：柱状/折线 300，饼状 300',
    },
    {
      key: 'title',
      label: '标题',
      required: false,
      default: '',
      description: '图表标题，显示在图表上方',
    },
    {
      key: 'colors',
      label: '颜色列表',
      required: false,
      default: '',
      description: '自定义颜色，逗号分隔，如 "#ff6b6b,#4ecdc4,#ffe66d"',
    },
    {
      key: 'color',
      label: '主题色',
      required: false,
      default: '',
      description: '色板基础色，如 "#3b82f6"。优先级低于 colors',
    },
    {
      key: 'smooth',
      label: '平滑曲线',
      required: false,
      default: 'false',
      options: ['true', 'false'],
      description: '折线图是否使用平滑曲线（仅 type=line 生效）',
    },
    {
      key: 'legends',
      label: '图例名称',
      required: false,
      default: '',
      description: '多组数据时的图例名称，逗号分隔，如 "收入,支出"',
    },
    {
      key: 'unit',
      label: '单位',
      required: false,
      default: '',
      description: '数据单位，显示在图表右上角，如 "万元"',
    },
  ],

  example: `<chart type="bar" labels="Q1,Q2,Q3,Q4" values="30,50,20,80" title="季度销售"></chart>`,

  render(
    attrs: Record<string, string>,
    _body: string,
    t: ThemeColors,
  ): string {
    const type = attrs.type || 'bar'
    const labels = (attrs.labels || '').split(',').map((s) => s.trim()).filter(Boolean)
    const rawValues = attrs.values || ''
    const valueGroups = (attrs.values || '').split(';').map(
      (g) => g.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))
    ).filter((g) => g.length === labels.length)
    const title = attrs.title || ''
    const smooth = attrs.smooth === 'true'

    if (type !== 'scatter' && (labels.length === 0 || valueGroups.length === 0)) {
      return `<section style="padding:20px;color:#999;font-size:14px">图表数据有误：labels 或 values 为空，或数量不匹配</section>`
    }
    if (type === 'scatter' && !rawValues) {
      return `<section style="padding:20px;color:#999;font-size:14px">图表数据有误：values 为空</section>`
    }

    const accent = attrs.color
      ? resolveColor(attrs.color)
      : resolveColor(t.accent)
    const width = parseInt(attrs.width || '375', 10)
    const height = attrs.height
      ? parseInt(attrs.height, 10)
      : 300

    const customColors = (attrs.colors || '').split(',').map((s) => s.trim()).filter(Boolean)
    const isScatter = type === 'scatter'
    const scatterSeriesCount = isScatter ? rawValues.split('|').length : 0
    const effectiveSeriesCount = isScatter ? scatterSeriesCount : valueGroups.length
    const colors = customColors.length >= effectiveSeriesCount
      ? customColors
      : generatePalette(accent, effectiveSeriesCount)

    const titleHTML = title
      ? `<text x="${width / 2}" y="24" text-anchor="middle" font-size="16" font-weight="700" fill="#111827">${esc(title)}</text>`
      : ''
    const topOffset = title ? 12 : 0

    // 图例（多组数据时）
    const legendNames = (attrs.legends || '').split(',').map((s) => s.trim()).filter(Boolean)
    const seriesCount = isScatter ? scatterSeriesCount : valueGroups.length
    let legendHTML = ''
    if (legendNames.length > 0) {
      const names: string[] = []
      for (let i = 0; i < seriesCount; i++) names.push(legendNames[i] || `系列${i + 1}`)
      const itemGap = 24
      const swatchW = 12
      const textW = Math.max(...names.map((n) => n.length)) * 7
      const itemW = swatchW + 6 + textW
      const totalW = seriesCount * itemW + (seriesCount - 1) * itemGap
      let x = (width - totalW) / 2
      const y = title ? 42 : 18
      let items = ''
      for (let i = 0; i < seriesCount; i++) {
        items += `<rect x="${x}" y="${y - 9}" width="12" height="12" rx="3" fill="${colors[i]}"/>`
        items += `<text x="${x + 18}" y="${y}" font-size="12" fill="#374151">${esc(names[i])}</text>`
        x += itemW + itemGap
      }
      legendHTML = `<g>${items}</g>`
    }

    const legendOffset = legendHTML ? 28 : 0

    const unit = attrs.unit || ''
    const unitHTML = unit ? `<text x="${width - 16}" y="18" text-anchor="end" font-size="11" fill="#9ca3af">单位：${esc(unit)}</text>` : ''

    const pieColors = type === 'pie'
      ? (customColors.length >= valueGroups[0].length ? customColors : generatePalette(accent, valueGroups[0].length))
      : []

    switch (type) {
      case 'bar': return renderBar(labels, valueGroups, colors, width, height, topOffset, titleHTML, legendOffset, legendHTML, unitHTML)
      case 'line': return renderLine(labels, valueGroups, colors, width, height, topOffset, titleHTML, accent, smooth, legendOffset, legendHTML, unitHTML)
      case 'pie': return renderPie(labels, valueGroups, pieColors, width, height, topOffset, titleHTML, unitHTML)
      case 'scatter': return renderScatter(labels, valueGroups, colors, width, height, topOffset, titleHTML, legendOffset, legendHTML, unitHTML, rawValues)
      default:
        return `<section style="padding:20px;color:#999;font-size:14px">不支持的图表类型：${esc(type)}</section>`
    }
  },
}

// ─── 柱状图 ────────────────────────────────────────

function renderBar(
  labels: string[], valueGroups: number[][], colors: string[],
  width: number, height: number, topOffset: number, titleHTML: string,
  legendOffset: number, legendHTML: string, unitHTML: string,
): string {
  const maxVal = Math.max(...valueGroups.flat())
  const chartTop = 20 + topOffset + legendOffset
  const chartBottom = height - 40
  const chartHeight = chartBottom - chartTop
  const barCount = labels.length
  const seriesCount = valueGroups.length
  const groupGap = 12
  const barGap = 2
  const totalGap = groupGap * (barCount + 1) + barGap * (seriesCount - 1) * barCount
  const barW = Math.max(4, (width - 80 - totalGap) / (barCount * seriesCount))
  const startX = 40 + groupGap

  let bars = ''
  for (let i = 0; i < barCount; i++) {
    for (let j = 0; j < seriesCount; j++) {
      const x = startX + i * (seriesCount * barW + groupGap + barGap * (seriesCount - 1)) + j * (barW + barGap)
      const barH = (valueGroups[j][i] / maxVal) * chartHeight
      const y = chartBottom - barH
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="${colors[j]}"/>`
      if (valueGroups[j][i] > 0) {
        bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="600" fill="#374151">${valueGroups[j][i]}</text>`
      }
    }
    bars += `<text x="${(startX + i * (seriesCount * barW + groupGap + barGap * (seriesCount - 1)) + (seriesCount * barW + barGap * (seriesCount - 1)) / 2).toFixed(1)}" y="${chartBottom + 14}" text-anchor="middle" font-size="12" fill="#6b7280">${esc(labels[i])}</text>`
  }

  return `
<section style="overflow-x:auto;text-align:center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${titleHTML}
  ${legendHTML}
  ${unitHTML}
  <line x1="40" y1="${chartBottom}" x2="${width - 40}" y2="${chartBottom}" stroke="#e5e7eb" stroke-width="1"/>
  ${bars}
</svg>
</section>`
}

// ─── 折线图 ────────────────────────────────────────

function renderLine(
  labels: string[], valueGroups: number[][], colors: string[],
  width: number, height: number, topOffset: number, titleHTML: string, accent: string, smooth: boolean,
  legendOffset: number, legendHTML: string, unitHTML: string,
): string {
  const maxVal = Math.max(...valueGroups.flat())
  const chartTop = 30 + topOffset + legendOffset
  const chartBottom = height - 40
  const chartHeight = chartBottom - chartTop
  const count = labels.length
  const startX = 40
  const endX = width - 20
  const stepX = (endX - startX) / (count - 1)
  const seriesCount = valueGroups.length

  // 底部标签
  let labelHTML = ''
  for (let i = 0; i < count; i++) {
    const x = startX + i * stepX
    labelHTML += `<text x="${x}" y="${chartBottom + 16}" text-anchor="middle" font-size="12" fill="#6b7280">${esc(labels[i])}</text>`
  }

  // 多组折线
  let seriesHTML = ''
  for (let j = 0; j < seriesCount; j++) {
    const values = valueGroups[j]
    const points: string[] = []
    const pts: { x: number; y: number }[] = []

    for (let i = 0; i < count; i++) {
      const x = startX + i * stepX
      const y = chartBottom - (values[i] / maxVal) * chartHeight
      points.push(`${x},${y}`)
      pts.push({ x, y })
    }

    // 折线
    seriesHTML += smooth
      ? `<path d="${smoothLinePath(pts)}" fill="none" stroke="${colors[j]}" stroke-width="2" stroke-linejoin="round"/>`
      : `<polyline points="${points.join(' ')}" fill="none" stroke="${colors[j]}" stroke-width="2" stroke-linejoin="round"/>`

    // 数据点 + 数值标签
    for (let i = 0; i < count; i++) {
      const x = startX + i * stepX
      const y = chartBottom - (values[i] / maxVal) * chartHeight
      seriesHTML += `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${colors[j]}" stroke-width="2"/>`
      seriesHTML += `<circle cx="${x}" cy="${y}" r="1.5" fill="${colors[j]}"/>`
      // 数值标签（每组偏移不同高度避免重叠）
      const labelY = j === 0 ? y - 10 : y + 16
      seriesHTML += `<text x="${x}" y="${labelY}" text-anchor="middle" font-size="11" font-weight="600" fill="${colors[j]}">${values[i]}</text>`
    }
  }

  return `
<section style="overflow-x:auto;text-align:center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${titleHTML}
  ${legendHTML}
  ${unitHTML}
  <line x1="50" y1="${chartBottom}" x2="${width - 30}" y2="${chartBottom}" stroke="#d1d5db" stroke-width="1"/>
  ${seriesHTML}
  ${labelHTML}
</svg>
</section>`
}

// ─── 散点图 ────────────────────────────────────────

function renderScatter(
  labels: string[], valueGroups: number[][], colors: string[],
  width: number, height: number, topOffset: number, titleHTML: string,
  legendOffset: number, legendHTML: string, unitHTML: string,
  rawValues: string,
): string {
  // 解析 data-pair 格式: "x,y;x,y|x,y;x,y" → 每组 [{x,y}...]
  const series = rawValues.split('|').map(seg => {
    return seg.split(';').map(pair => {
      const [x, y] = pair.split(',').map(Number)
      return { x, y }
    })
  })
  const seriesCount = series.length
  const allX = series.flat().map(d => d.x)
  const allY = series.flat().map(d => d.y)
  const minX = 0
  const maxX = Math.ceil(Math.max(...allX) * 1.05) || 10
  const maxY = Math.ceil(Math.max(...allY) * 1.05) || 10

  const chartTop = 30 + topOffset + legendOffset
  const chartBottom = height - 40
  const chartHeight = chartBottom - chartTop
  const startX = 50
  const endX = width - 20
  const chartWidth = endX - startX

  // 水平网格线
  const yTickCount = 5
  let gridHTML = ''
  for (let t = 0; t <= yTickCount; t++) {
    const y = chartBottom - (t / yTickCount) * chartHeight
    const val = Math.round((t / yTickCount) * maxY)
    gridHTML += `<line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>`
    gridHTML += `<text x="${startX - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9ca3af">${val}</text>`
  }

  // 竖直网格线 + x 轴标签
  const xTickCount = 5
  for (let t = 0; t <= xTickCount; t++) {
    const x = startX + (t / xTickCount) * chartWidth
    const val = Math.round((t / xTickCount) * maxX)
    gridHTML += `<line x1="${x}" y1="${chartTop}" x2="${x}" y2="${chartBottom}" stroke="#f3f4f6" stroke-width="1"/>`
    gridHTML += `<text x="${x}" y="${chartBottom + 16}" text-anchor="middle" font-size="12" fill="#6b7280">${val}</text>`
  }

  // 数据点
  let dotsHTML = ''
  for (let j = 0; j < seriesCount; j++) {
    for (const d of series[j]) {
      const cx = startX + (d.x / maxX) * chartWidth
      const cy = chartBottom - (d.y / maxY) * chartHeight
      dotsHTML += `<circle cx="${cx}" cy="${cy}" r="5" fill="${colors[j]}"/>`
    }
  }

  // 坐标轴
  const axisHTML = `
    <line x1="${startX}" y1="${chartBottom}" x2="${endX}" y2="${chartBottom}" stroke="#d1d5db" stroke-width="1"/>
    <line x1="${startX}" y1="${chartTop}" x2="${startX}" y2="${chartBottom}" stroke="#d1d5db" stroke-width="1"/>`

  return `
<section style="overflow-x:auto;text-align:center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${titleHTML}
  ${legendHTML}
  ${unitHTML}
  ${gridHTML}
  ${axisHTML}
  ${dotsHTML}
</svg>
</section>`
}

// ─── 饼状图 ────────────────────────────────────────

function renderPie(
  labels: string[], valueGroups: number[][], colors: string[],
  width: number, height: number, topOffset: number, titleHTML: string, unitHTML: string,
): string {
  const values = valueGroups[0]
  const total = values.reduce((sum, v) => sum + v, 0)
  const cx = width * 0.3
  const cy = height * 0.5 + topOffset * 0.5
  const r = Math.min(width * 0.25, height * 0.38)

  // 扇形
  let startAngle = -Math.PI / 2
  let slicesHTML = ''
  for (let i = 0; i < values.length; i++) {
    const sliceAngle = (values[i] / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle
    slicesHTML += `<path d="${pieSlicePath(cx, cy, r, startAngle, endAngle)}" fill="${colors[i]}"/>`
    startAngle = endAngle
  }

  // 图例
  const legendX = width * 0.62
  const legendStartY = cy - (values.length * 22) / 2
  let legendHTML = ''
  for (let i = 0; i < values.length; i++) {
    const pct = Math.round((values[i] / total) * 100)
    const y = legendStartY + i * 26
    legendHTML += `<rect x="${legendX}" y="${y}" width="12" height="12" rx="2" fill="${colors[i]}"/>`
    legendHTML += `<text x="${legendX + 20}" y="${y + 11}" font-size="13" fill="#374151">${esc(labels[i])}  ${pct}%</text>`
  }

  return `
<section style="overflow-x:auto;text-align:center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${titleHTML}
  ${unitHTML}
  ${slicesHTML}
  ${legendHTML}
</svg>
</section>`
}
