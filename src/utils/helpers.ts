export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function leaf(s: string | number): string {
  return `<span leaf="">${s}</span>`
}

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function lightenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lr = Math.round(r + (255 - r) * factor)
  const lg = Math.round(g + (255 - g) * factor)
  const lb = Math.round(b + (255 - b) * factor)
  return '#' + ((1 << 24) + (lr << 16) + (lg << 8) + lb).toString(16).slice(1)
}

/**
 * 将任意颜色值（hex / rgb / 命名色）转为带透明度的背景色。
 * @param color  原始颜色，如 "#e74c3c"、"rgb(231,76,60)"、"red"
 * @param alpha  透明度 0~1，默认 0.06（约等于 hex 末尾追加 "10" 的效果）
 */
export function withAlpha(color: string, alpha = 0.06): string {
  // 已经是 rgba 格式，直接替换 alpha
  if (/^rgba?\(/.test(color)) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map((s: string) => s.trim())
      if (parts.length >= 3) return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`
      return color
    })
  }
  // hex 格式
  if (color.startsWith('#')) {
    const hex =
      color.length === 4
        ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
        : color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  // 命名色：用 canvas 测量
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d')
    if (ctx) {
      ctx.fillStyle = color
      const computed = ctx.fillStyle // 浏览器会转为 hex
      if (computed.startsWith('#')) {
        const r = parseInt(computed.slice(1, 3), 16)
        const g = parseInt(computed.slice(3, 5), 16)
        const b = parseInt(computed.slice(5, 7), 16)
        return `rgba(${r},${g},${b},${alpha})`
      }
    }
  }
  // 兜底：直接用 CSS color-mix
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

export function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  // 匹配 key="value"、key=value（无引号）和无值布尔属性（如 round）
  s.replace(
    /([\w-]+)="([^"]*)"|([\w-]+)=([\w-]+)|([\w-]+)/g,
    (_, k1: string, v: string, k2: string, v2: string, k3: string) => {
      if (k1) attrs[k1] = v
      else if (k2) attrs[k2] = v2
      else if (k3) attrs[k3] = 'true'
      return ''
    },
  )
  return attrs
}
