import type { ThemeColors } from '../composables/useTheme'
import { leaf, esc, parseAttrs } from './helpers'
import { inlineFormat } from './inlineFormat'
import {
  renderFrontMatter,
  parseBadges,
  parseCtaBlock,
  parseCtaInline,
  parseCompare,
  parseCallout,
  parseEngage,
  parseGallery,
} from './components'
import { Title_DA01 } from '@/editor-components/Title_DA01'
import { ParagraphTitle_DA01 } from '@/editor-components/ParagraphTitle_DA01'
import { Breaking_DA01 } from '@/editor-components/Breaking_DA01'
import { Steps_DA01 } from '@/editor-components/Steps_DA01'

export function parseMarkdown(md: string, t: ThemeColors): string {
  const lines = md.split('\n')
  let html = ''
  let i = 0

  // front-matter
  if (lines[0] && lines[0].trim() === '---') {
    i = 1
    const meta: Record<string, string> = {}
    while (i < lines.length && lines[i].trim() !== '---') {
      const m = lines[i].match(/^(\w+):\s*(.+)/)
      if (m) meta[m[1]] = m[2].trim()
      i++
    }
    i++
    html += renderFrontMatter(meta, md, t)
  }

      // 收集 h2（用于 <reading-path> 标签）
  const h2List: string[] = []
  let h3Count = 0
  let h4Count = 0
  for (let j = 0; j < lines.length; j++) {
    const h2m = lines[j].match(/^##\s+(.+)/)
    if (h2m) h2List.push(h2m[1])
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }
    if (/^---+\s*$/.test(line.trim())) {
      html += `<section style="border:none;height:1px;background:linear-gradient(90deg,transparent,rgb(221,221,221),transparent);margin:24px 0px"></section>`
      i++
      continue
    }

            // <steps>
    if (/^<steps\b/.test(line)) {
      const openMatch = line.match(/^<steps\b([^>]*)>/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      i++
      let body = ''
      while (i < lines.length && !/^<\/steps>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </steps>
      html += Steps_DA01.render(attrs, body.trim(), t)
      continue
    }
    // ::: statement
    if (/^:::\s*statement\b/.test(line)) {
      i++
      let text = ''
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        text += lines[i]
        i++
      }
      i++
            html += `<section style="margin:20px 0px"><p style="text-align:center;font-size:18px;font-weight:700;color:rgb(51,65,85);line-height:1.6">${inlineFormat(text, t)}</p></section>`
      continue
    }
    // ::: badges
    if (/^:::\s*badges\b/.test(line)) {
      const r = parseBadges(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
    // ::: cta
    if (/^:::\s*cta\b/.test(line)) {
      const r = parseCtaBlock(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
    // ::: lead
    if (/^:::\s*lead\b/.test(line)) {
      i++
      let text = ''
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        text += lines[i]
        i++
      }
      i++
      html += `<section><p style="font-size:16px;color:rgb(85,85,85);line-height:1.8;padding:16px 0px;border-left:3px solid ${t.accent};padding-left:16px;margin:14px 0px">${inlineFormat(text, t)}</p></section>`
      continue
    }
        // <breaking>
    if (/^<breaking\b/.test(line)) {
      const openMatch = line.match(/^<breaking\b([^>]*)>/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      i++
      let body = ''
      while (i < lines.length && !/^<\/breaking>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </breaking>
      html += Breaking_DA01.render(attrs, body.trim(), t)
      continue
    }
    // <cta>
    if (/^<cta\b/.test(line)) {
      const r = parseCtaInline(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
        // <compare>
    if (/^<compare\b/.test(line)) {
      const r = parseCompare(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
    // <reading-path> 或 <reading-path />
    if (/^<reading-path\s*\/?>/.test(line) || /^<reading-path>/.test(line)) {
      // 渲染阅读路线组件
      if (h2List.length > 1) {
        html += `<section style="margin:0px 0px 30px"><section>`
        html += `<section style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:14px;gap:12px"><section style="flex-shrink:0"><p style="margin:0px;padding:0px 0px 6px;font-size:10px;color:rgb(100,116,139);text-transform:uppercase;letter-spacing:2.8px;font-weight:800;white-space:nowrap">${leaf('READING PATH')}</p><p style="margin:0px;font-size:16px;line-height:1.35;color:rgb(17,24,39);font-weight:800">${leaf('阅读路线')}</p></section><p style="margin:0px;font-size:10px;color:rgb(148,163,184);white-space:nowrap">${leaf(h2List.length + ' 个章节')}</p></section>`
        html += `<section style="padding:14px 12px 12px;border:1px solid rgb(229,231,235);border-radius:13px;background:linear-gradient(rgb(255,255,255) 0%,rgb(248,250,252) 100%);box-shadow:rgba(15,23,42,0.04) 0px 12px 30px;overflow-x:auto;white-space:nowrap;font-size:0px">`
        h2List.forEach((t2, idx) => {
          const label = t2
            .replace(/::.*/, '')
            .trim()
            .replace(/^\d+\s*/, '')
          const num = String(idx + 1).padStart(2, '0')
          const isActive = idx === 0
          html += `<section style="display:inline-flex;vertical-align:middle;align-items:center">`
          html += `<section style="display:inline-block;vertical-align:top;width:126px;white-space:normal;text-align:center">`
          html += `<section style="display:flex;justify-content:center;margin-bottom:10px">`
          html += `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${isActive ? t.accent : 'rgb(255,255,255)'};color:${isActive ? 'rgb(255,255,255)' : 'rgb(17,24,39)'};border:1px solid ${isActive ? t.accent : 'rgb(219,227,238)'};font-size:11px;font-weight:900;letter-spacing:1.2px;white-space:nowrap">${leaf(num)}</span>`
          html += `</section>`
          html += `<p style="margin:0px;font-size:13px;line-height:1.55;color:${isActive ? 'rgb(17,24,39)' : 'rgb(31,41,55)'};font-weight:800;letter-spacing:0.05px;white-space:normal;word-break:break-all">${leaf(label)}</p>`
          html += `</section>`
          if (idx < h2List.length - 1) {
            html += `<span style="display:inline-block;vertical-align:middle;width:32px;height:1px;line-height:1px;margin:0px 8px;background:linear-gradient(90deg,rgba(148,163,184,0.35),rgba(148,163,184,0.85));color:transparent;overflow:hidden">${leaf('-')}</span>`
          }
          html += `</section>`
        })
        html += `</section></section></section>`
      }
      // 跳过闭合标签（如果有）
      if (/^<reading-path>/.test(line) && i + 1 < lines.length && /^<\/reading-path>/.test(lines[i + 1])) {
        i += 2
      } else {
        i++
      }
      continue
    }
            // <title> 标签（新组件语法）
    if (/^<title\b/.test(line)) {
      const titleMatch = line.match(/^<title\b([^>]*)>([\s\S]*?)<\/title>/)
      if (titleMatch) {
        const attrs = parseAttrs(titleMatch[1])
        const body = titleMatch[2].trim()
                html += Title_DA01.render(attrs, body, t, md)
      }
      i++
      continue
    }

        // <p-title> 段落标题标签
    if (/^<p-title\b/.test(line)) {
      const ptMatch = line.match(/^<p-title\b([^>]*)>([\s\S]*?)<\/p-title>/)
      if (ptMatch) {
        const attrs = parseAttrs(ptMatch[1])
        const body = ptMatch[2].trim()
        html += ParagraphTitle_DA01.render(attrs, body, t)
      }
      i++
      continue
    }

    // < ![
    if (/^<\s*!\[/.test(line)) {
      const r = parseGallery(lines, i)
      html += r.html
      i = r.next
      continue
    }
    // > [TIP] etc
    if (/^>\s*\[(TIP|NOTE|WARNING|CAUTION|IMPORTANT)\]/.test(line)) {
      const r = parseCallout(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
    // > quote
    if (/^>\s/.test(line)) {
      const ql: string[] = []
      while (i < lines.length && /^>\s/.test(lines[i])) {
        ql.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      html += `<section style="margin:14px 0px;padding:12px 16px;background:rgb(247,248,252);border-left:3px solid ${t.accent};border-radius:0px 6px 6px 0px;color:rgb(85,85,85);font-size:14px">`
      ql.forEach((l) => {
        html += `<section><p style="margin:4px 0px">${inlineFormat(l, t)}</p></section>`
      })
      html += `</section>`
      continue
    }
    // 案例流
    if (/^-\s*\[案例\s*\d+\]/.test(line)) {
      const cases: { badge: string; text: string }[] = []
      while (i < lines.length && /^-\s*\[案例\s*\d+\]/.test(lines[i])) {
        const cm = lines[i].match(/^-\s*\[(案例\s*\d+)\]\s*(.+)/)
        if (cm) cases.push({ badge: cm[1], text: cm[2] })
        i++
      }
      html += `<section style="margin:16px 0px;display:flex;flex-direction:column;gap:10px">`
      cases.forEach((c) => {
        html += `<section style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgb(250,251,254);border-radius:10px;border:1px solid rgb(238,238,238)"><section style="flex-shrink:0;font-size:11px;font-weight:700;color:${t.accent};background:${t.light};padding:3px 10px;border-radius:6px;white-space:nowrap">${leaf(c.badge)}</section><section style="font-size:14px;color:rgb(85,85,85);line-height:1.6">${inlineFormat(c.text, t)}</section></section>`
      })
      html += `</section>`
      continue
    }
    // : engage
    if (/^:\s*engage\b/.test(line)) {
      const r = parseEngage(lines, i, t)
      html += r.html
      i = r.next
      continue
    }

    // 标题
    const h1m = line.match(/^#\s+(.+)/)
    if (h1m) {
      html += `<section><p style="margin:0px 0px 24px;font-size:22px;font-weight:800;color:rgb(17,24,39);line-height:1.4">${inlineFormat(h1m[1], t)}</p></section>`
      i++
      continue
    }

    const h2m = line.match(/^##\s+(.+)/)
    if (h2m) {
      const h2idx = h2List.indexOf(h2m[1])
      const title = h2m[1]
        .replace(/::.*/, '')
        .trim()
        .replace(/^\d+\s*/, '')
      const sub = h2m[1].match(/::\s*(.+)/)
      const chNum = String(h2idx >= 0 ? h2idx + 1 : 1).padStart(2, '0')
      const chLabel = sub ? sub[1].trim() : ''
      html += `<section style="margin:48px 0px 30px"><section style="clear:both">`
      html += `<section style="display:flex;align-items:center;margin:0;padding-bottom:12px"><span style="font-size:10px;font-weight:800;color:rgb(148,163,184);letter-spacing:2.6px;text-transform:uppercase;white-space:nowrap">${leaf('CHAPTER ' + chNum)}</span><section style="flex:1;border-top:1px solid rgb(229,231,235);margin:0 0 0 12px;height:0"></section></section>`
      html += `<section style="margin:0">`
      html += `<strong style="display:block;font-size:60px;line-height:1;color:rgba(${t.rgb},0.25);letter-spacing:-3px;white-space:nowrap">${leaf(chNum)}</strong>`
      html += `<strong style="display:block;font-size:30px;font-weight:900;color:rgb(17,24,39);line-height:1.26;letter-spacing:-0.8px;margin-top:-60px;margin-left:50px">${leaf(title)}</strong>`
      if (chLabel)
        html += `<span style="display:block;margin-left:50px;font-size:11px;color:${t.accent};font-weight:700;text-transform:uppercase;letter-spacing:1.6px">${leaf(chLabel)}</span>`
      html += `</section>`
      html += `</section></section>`
      i++
      continue
    }

            const h3m = line.match(/^###\s+(.+)/)
    if (h3m) {
      h3Count++
      let h3Num = String(h3Count).padStart(2, '0')
      let h3Title = h3m[1]
      // 检测标题是否以数字开头（如 "01 突发/重大更新卡片"），如果是则用用户的数字作为序号
      const h3NumMatch = h3Title.match(/^(\d{1,2})\s+(.+)/)
      if (h3NumMatch) {
        h3Num = h3NumMatch[1]
        h3Title = h3NumMatch[2]
      }
      html += ParagraphTitle_DA01.render(
        { num: h3Num, level: '2' },
        h3Title, t,
      )
      i++
      continue
    }

        const h4m = line.match(/^####\s+(.+)/)
    if (h4m) {
      h4Count++
      let h4Num = String(h4Count).padStart(2, '0')
      let h4Title = h4m[1]
      // 检测标题是否以数字开头（如 "01 突发/重大更新卡片"），如果是则用用户的数字作为序号
      const h4NumMatch = h4Title.match(/^(\d{1,2})\s+(.+)/)
      if (h4NumMatch) {
        h4Num = h4NumMatch[1]
        h4Title = h4NumMatch[2]
      }
      html += ParagraphTitle_DA01.render(
        { num: h4Num, level: '3' },
        h4Title, t,
      )
      i++
      continue
    }

    // 代码块
    if (/^```/.test(line)) {
      const _lang = line.replace(/^```/, '').trim()
      i++
      let code = ''
      while (i < lines.length && !/^```/.test(lines[i])) {
        code += lines[i] + '\n'
        i++
      }
      i++
            html += `<section style="background:rgb(30,30,46);color:rgb(205,214,244);padding:14px 16px;border-radius:8px;overflow-x:auto;margin:14px 0px;font-size:12.5px;line-height:1.6"><code style="background:none;color:inherit;padding:0;font-size:inherit;white-space:pre">${esc(code.trimEnd())}</code></section>`
      continue
    }

    // 表格
    if (line.indexOf('|') >= 0 && i + 1 < lines.length && /\|[\s-:]+\|/.test(lines[i + 1])) {
      const headers = line
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].indexOf('|') >= 0 && lines[i].trim() !== '') {
        rows.push(
          lines[i]
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean),
        )
        i++
      }
      html += `<section style="margin:0px 0px 30px;box-shadow:rgba(15,23,42,0.05) 0px 10px 24px;border-radius:14px;border:1px solid rgba(229,231,235,0.9);overflow:hidden;background:linear-gradient(135deg,rgb(248,250,252) 0%,rgb(238,244,251) 100%)"><section style="padding:28px 20px;background:rgba(255,255,255,0.92)"><div class="tableWrapper" style="width:100%"><table style="border:0px;border-collapse:collapse;table-layout:fixed;min-width:115px;width:100%"><thead><tr>`
      headers.forEach((h) => {
        html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left;font-size:13px;font-weight:700;color:rgb(51,65,85)">${inlineFormat(h, t)}</td>`
      })
      html += `</tr></thead><tbody>`
      rows.forEach((r) => {
        html += `<tr>`
        r.forEach((c) => {
          html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left;font-size:13px;color:rgb(51,65,85)">${inlineFormat(c, t)}</td>`
        })
        html += `</tr>`
      })
      html += `</tbody></table></div></section></section>`
      continue
    }

    // 无序列表
    if (/^[-*+]\s/.test(line)) {
      html += `<section style="margin:10px 0px;padding-left:24px">`
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const li = lines[i].replace(/^[-*+]\s/, '')
        const cb = li.match(/^\[([ x])\]\s*(.*)/)
        if (cb) {
          html += `<section style="margin:5px 0px"><input type="checkbox" ${cb[1] === 'x' ? 'checked' : ''} disabled> ${inlineFormat(cb[2], t)}</section>`
        } else {
          html += `<section style="margin:5px 0px">${inlineFormat(li, t)}</section>`
        }
        i++
      }
      html += `</section>`
      continue
    }

    // 有序列表
    if (/^\d+\.\s/.test(line)) {
      html += `<section style="margin:10px 0px;padding-left:24px">`
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        html += `<section style="margin:5px 0px">${inlineFormat(lines[i].replace(/^\d+\.\s/, ''), t)}</section>`
        i++
      }
      html += `</section>`
      continue
    }

    // 图片
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/)
    if (imgMatch) {
      const [, alt, src, size] = imgMatch
      if (size) {
        const parts = size.split(/\s+/)
        html += `<section style="max-height:${parts[1] || '250px'};overflow-y:auto;border-radius:8px;margin:12px 0px"><img src="${esc(src)}" alt="${esc(alt)}" style="width:${parts[0] || '100%'};display:block"></section>`
      } else {
        html += `<img src="${esc(src)}" alt="${esc(alt)}" style="max-width:100%;border-radius:6px;margin:12px 0px;display:block">`
      }
      i++
      continue
    }

    // 普通段落
          html += `<section style="margin:0px 0px 24px"><p style="margin:0px;font-size:16px;color:rgb(51,65,85);line-height:1.85;text-align:justify;overflow-wrap:break-word">${inlineFormat(line, t)}</p></section>`
    i++
  }

  return html
}
