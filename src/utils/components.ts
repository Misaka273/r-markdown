import type { ThemeColors } from '@/composables/useTheme'
import { esc, leaf, parseAttrs } from './helpers'
import { inlineFormat } from './inlineFormat'
import { Compare_DA01 } from '@/extension/Compare_DA01'
import { Compare_DA02 } from '@/extension/Compare_DA02'
import { CTA_DA01 } from '@/extension/Cta_DA01'

export function parseCtaTag(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const openMatch = lines[i].match(/<cta\s*(.*)>/)
  const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
  i++
  let body = ''
  while (i < lines.length && !/^<\/cta>/.test(lines[i])) {
    body += lines[i] + '\n'
    i++
  }
  i++
  return { html: CTA_DA01.render(attrs, body, t), next: i }
}

export function parseCtaInline(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  const attrs = parseAttrs(lines[start])
  return { html: CTA_DA01.render(attrs, '', t), next: start + 1 }
}

export function parseCompare(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const attrs = parseAttrs(lines[i])
  i++
  let leftContent = '',
    rightContent = '',
    side = ''
  while (i < lines.length && !/^<\/compare>/.test(lines[i])) {
    if (/^<left>/.test(lines[i])) {
      side = 'left'
      i++
      continue
    }
    if (/^<\/left>/.test(lines[i])) {
      side = ''
      i++
      continue
    }
    if (/^<right>/.test(lines[i])) {
      side = 'right'
      i++
      continue
    }
    if (/^<\/right>/.test(lines[i])) {
      side = ''
      i++
      continue
    }
    if (side === 'left') leftContent += lines[i] + '\n'
    if (side === 'right') rightContent += lines[i] + '\n'
    i++
  }
  i++

  // 构造 body 供 Compare_DA01 解析
  const body = `<left>\n${leftContent}</left>\n<right>\n${rightContent}</right>`

  // 使用 inlineFormat 渲染内部 markdown
  const inlineRenderer = (md: string) => inlineFormat(md, t)

  const renderer = attrs.type === 'DA02' ? Compare_DA02 : Compare_DA01
  return { html: renderer.render(attrs, body, t, inlineRenderer), next: i }
}

export function parseCallout(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const m = lines[i].match(/>\s*\[(TIP|NOTE|WARNING|CAUTION|IMPORTANT)\]\s*(.*)/)
  const type = m ? m[1] : 'NOTE'
  const title = m ? m[2] : ''
  i++
  let body = ''
  while (i < lines.length && /^>\s/.test(lines[i])) {
    body += lines[i].replace(/^>\s?/, '') + '\n'
    i++
  }
  const icons: Record<string, string> = {
    TIP: '💡',
    NOTE: '📝',
    WARNING: '⚠️',
    CAUTION: '🚨',
    IMPORTANT: '❗',
  }
  const bgs: Record<string, string> = {
    TIP: '#f0f4fa',
    NOTE: '#f0f4fa',
    WARNING: '#fff8f0',
    CAUTION: '#fff0f0',
    IMPORTANT: '#f0f4fa',
  }
  const borders: Record<string, string> = {
    TIP: t.accent,
    NOTE: t.accent,
    WARNING: '#f5a623',
    CAUTION: '#e74c3c',
    IMPORTANT: t.accent,
  }
  const bg = bgs[type] || '#f0f4fa'
  const border = borders[type] || t.accent
  let html = `<section style="margin:14px 0px;padding:16px 18px;background:${bg};border-left:4px solid ${border};border-radius:0px 10px 10px 0px">`
  if (title)
    html += `<p style="margin:0px 0px 6px;font-size:14px;font-weight:700;color:rgb(51,65,85)">${leaf((icons[type] || '') + ' ' + title)}</p>`
  if (body.trim())
    html += `<section style="font-size:14px;color:rgb(85,85,85);line-height:1.7">${inlineFormat(body.trim(), t)}</section>`
  html += `</section>`
  return { html, next: i }
}

export function parseGallery(lines: string[], start: number): { html: string; next: number } {
  let i = start
  const imgs: { alt: string; src: string }[] = []
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(lines[i])) !== null) {
    imgs.push({ alt: m[1], src: m[2] })
  }
  i++
  let html = `<section style="white-space:nowrap;overflow-x:auto;margin:12px 0px;padding:4px 0px">`
  imgs.forEach((img) => {
    html += `<img src="${esc(img.src)}" alt="${esc(img.alt)}" style="display:inline-block;vertical-align:top;max-height:200px;border-radius:8px;margin-right:8px">`
  })
  html += `</section>`
  return { html, next: i }
}
