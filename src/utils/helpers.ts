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

export function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {}
    s.replace(/([\w-]+)="([^"]*)"/g, (_, k: string, v: string) => {
    attrs[k] = v
    return ''
  })
  return attrs
}
