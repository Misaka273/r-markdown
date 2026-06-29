import type { ThemeColors } from '@/composables/useTheme'
import hljs from 'highlight.js/lib/common'
import { leaf, esc, parseAttrs } from './helpers'
import { inlineFormat } from './inlineFormat'
import { renderMath, preloadMathJax } from './mathRenderer'
import {
  parseCtaInline,
  parseCtaTag,
  parseCompare,
  parseCallout,
  parseGallery,
} from './components'
import { Title_DA01 } from '@/extension/Title_DA01'
import { Title_DA02 } from '@/extension/Title_DA02'
import { PTitle } from '@/extension/PTitle_DA01'
import { Breaking_DA01 } from '@/extension/Breaking_DA01'
import { Steps_DA01 } from '@/extension/Steps_DA01'
import { Steps_DA02 } from '@/extension/Steps_DA02'
import { CaseFlow_DA01 } from '@/extension/CaseFlow_DA01'
import { Badges_DA01 } from '@/extension/Badges_DA01'
import { ReadingPath_DA01 } from '@/extension/ReadingPath_DA01'
import { Statement_DA01 } from '@/extension/Statement_DA01'
import { Lead_DA01 } from '@/extension/Lead_DA01'
import { Engage_DA01 } from '@/extension/Engage_DA01'
import { Engage_DA02 } from '@/extension/Engage_DA02'
import { Timeline_DA01 } from '@/extension/Timeline_DA01'
import { Slider_DA01 } from '@/extension/Slider_DA01'
import { Img_DA01 } from '@/extension/Img_DA01'
import { Chart_DA01 } from '@/extension/Chart_DA01'

// 语法高亮配色（one-dark 风，配深色代码块底）。把 highlight.js 的 class 转成内联颜色，
// 这样预览和粘贴到公众号都能直接显示（不依赖外部样式表）。
const HL_COLORS: Record<string, string> = {
    keyword: '#c678dd',
    built_in: '#56b6c2',
    type: '#e5c07b',
    literal: '#56b6c2',
    number: '#d19a66',
    string: '#98c379',
    regexp: '#98c379',
    comment: '#7f848e',
    doctag: '#7f848e',
    meta: '#7f848e',
    title: '#61afef',
    attr: '#d19a66',
    attribute: '#d19a66',
    variable: '#e06c75',
    tag: '#e06c75',
    name: '#e06c75',
    params: '#abb2bf',
    property: '#e06c75',
    operator: '#56b6c2',
    symbol: '#56b6c2',
    selector: '#e06c75',
    bullet: '#61afef',
    link: '#98c379',
    quote: '#98c379',
    addition: '#98c379',
    deletion: '#e06c75',
    section: '#61afef',
    function: '#61afef',
}

// 单行高亮：highlight.js 出 class 标记，再把 class 换成内联 color（自包含，不依赖外部样式表）。
function highlightLine(rest: string, lang: string): string {
    let out: string
    try {
        out =
            lang && hljs.getLanguage(lang)
                ? hljs.highlight(rest, { language: lang }).value
                : hljs.highlightAuto(rest).value
    } catch {
        out = esc(rest)
    }
    return out.replace(/class="hljs-([a-z_]+)[^"]*"/g, (_m, c: string) =>
        HL_COLORS[c] ? `style="color:${HL_COLORS[c]}"` : '',
    )
}

/**
 * 收集 md 中所有公式（去重），按 inline/block 分类返回，用于预渲染。
 */
export function collectFormulas(md: string): Array<{ formula: string; display: boolean }> {
  const seen = new Set<string>()
  const result: Array<{ formula: string; display: boolean }> = []

  // 先删围栏代码块（行首锚定），再删行内代码（支持多重反引号嵌套）
  const cleaned = md
    .replace(/^```[\s\S]*?\n```/gm, '')
    .replace(/(`+)(.*?)\1/gs, '')

  // 行内公式 $...$
  const inlineRe = /(?<!\$)(?<!\d)\$([^\$]+?)\$(?!\$|[\w])/g
  const pureNumberRe = /^\d+(\.\d+)?$/
  let m: RegExpExecArray | null
  while ((m = inlineRe.exec(cleaned)) !== null) {
    const f = m[1].trim()
    // 过滤纯数字（如 $100），避免误匹配货币金额
    if (pureNumberRe.test(f)) continue
    const key = `i:${f}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ formula: f, display: false })
    }
  }

  // 块级公式 $$...$$ （单行和多行）
  const blockRe = /\$\$([\s\S]+?)\$\$/g
  while ((m = blockRe.exec(cleaned)) !== null) {
    // 跳过空行 $$ $$ 前面的 $$
    if (m[0] === '$$') continue
    const f = m[1].trim()
    if (!f) continue
    const key = `b:${f}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ formula: f, display: true })
    }
  }

  return result
}

/**
 * 批量预渲染公式为 SVG。
 */
export async function preRenderFormulas(
  formulas: Array<{ formula: string; display: boolean }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const results = await Promise.all(
    formulas.map(async (f) => {
      const prefix = f.display ? 'b' : 'i'
      const svg = await renderMath(f.formula, f.display)
      return { key: `${prefix}:${f.formula}`, svg }
    }),
  )
  for (const { key, svg } of results) {
    map.set(key, svg)
  }
  return map
}

/**
 * 一步完成：收集公式 → 预渲染 → 解析。
 * 推荐所有 caller 使用这个入口。
 */
export async function parseMarkdownAsync(md: string, t: ThemeColors): Promise<string> {
  const formulas = collectFormulas(md)
  const formulaMap = formulas.length > 0 ? await preRenderFormulas(formulas) : undefined
  return parseMarkdown(md, t, formulaMap)
}

export function parseMarkdown(md: string, t: ThemeColors, formulaMap?: Map<string, string>): string {
  // 收集脚注：[text](url "desc") 带引号标题的链接 → 脚注
  const footnotes: { label: string; url: string; desc: string }[] = []
  const footnoteRegex = /\[([^\]]+)\]\(([^)\s]+)\s+"([^"]+)"\)/g
  const processedMd = md.replace(footnoteRegex, (_match, _label, url, desc) => {
    // 检查是否已存在相同的脚注（根据 url 和 desc 判断）
    const existing = footnotes.findIndex((f) => f.url === url && f.desc === desc)
    let num: number
    if (existing >= 0) {
      // 已存在，复用序号
      num = existing + 1
    } else {
      // 新脚注，分配新序号
      num = footnotes.length + 1
      footnotes.push({ label: _label, url, desc })
    }
    return `__FN_${num - 1}__|${_label}|`
  })

  const lines = processedMd.split('\n')
  let html = ''
  let i = 0

  // 收集 p-title level1（用于 <reading-path> 标签）
  const pTitleLevel1List: { num: string; title: string; subtitle: string }[] = []
  for (let j = 0; j < lines.length; j++) {
    // 匹配 <p-title ...> 标签
    const ptMatch = lines[j].match(/^<p-title\b([^>]*)>([\s\S]*?)<\/p-title>/)
    if (ptMatch) {
      const attrs = parseAttrs(ptMatch[1])
      const level = parseInt(attrs.level || '1', 10)
      if (level === 1) {
        const num = attrs.num || ''
        const title = attrs.title || ptMatch[2].trim()
        const subtitle = attrs.subtitle || ''
        pTitleLevel1List.push({ num, title, subtitle })
      }
    }
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
      const stepsRenderer = attrs.type === 'DA02' ? Steps_DA02 : Steps_DA01
      html += stepsRenderer.render(attrs, body.trim(), t)
      continue
    }
    // <statement> ... </statement>
    if (/^<statement\b/.test(line)) {
      const openMatch = line.match(/^<statement\b([^>]*)>(.*)$/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      // 单行模式
      if (openMatch && openMatch[2] && /<\/statement>\s*$/.test(openMatch[2])) {
        const text = openMatch[2].replace(/<\/statement>\s*$/, '').trim()
        html += Statement_DA01.render(attrs, text, t)
        i++
        continue
      }
      // 多行模式
      let text = openMatch && openMatch[2] ? openMatch[2] + '\n' : ''
      i++
      while (i < lines.length && !/^<\/statement>/.test(lines[i])) {
        text += lines[i]
        i++
      }
      i++
      html += Statement_DA01.render(attrs, text.trim(), t)
      continue
    }
    // <badges> ... </badges> (支持单行和多行)
    if (/^<badges\b/.test(line)) {
      const openMatch = line.match(/^<badges\b([^>]*)>(.*)$/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      // 单行模式：<badges ...>content</badges>
      if (openMatch && openMatch[2] && /<\/badges>\s*$/.test(openMatch[2])) {
        const body = openMatch[2].replace(/<\/badges>\s*$/, '').trim()
        html += Badges_DA01.render(attrs, body, t)
        i++
        continue
      }
      // 多行模式：内容在后续行
      let body = openMatch && openMatch[2] ? openMatch[2] + '\n' : ''
      i++
      while (i < lines.length && !/^<\/badges>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </badges>
      html += Badges_DA01.render(attrs, body.trim(), t)
      continue
    }
    // <lead> ... </lead>
    if (/^<lead\b/.test(line)) {
      const openMatch = line.match(/^<lead\b([^>]*)>(.*)$/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      // 单行模式
      if (openMatch && openMatch[2] && /<\/lead>\s*$/.test(openMatch[2])) {
        const text = openMatch[2].replace(/<\/lead>\s*$/, '').trim()
        html += Lead_DA01.render(attrs, text, t)
        i++
        continue
      }
      // 多行模式
      let text = openMatch && openMatch[2] ? openMatch[2] + '\n' : ''
      i++
      while (i < lines.length && !/^<\/lead>/.test(lines[i])) {
        text += lines[i]
        i++
      }
      i++
      html += Lead_DA01.render(attrs, text.trim(), t)
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
      if (/\/>\s*$/.test(line)) {
        // 自闭合行内形式：<cta .../>
        const r = parseCtaInline(lines, i, t)
        html += r.html
        i = r.next
      } else {
        // 前窥后续是否存在 </cta> 关闭标签，有则走标签形式，否则按行内处理
        let hasClosingCta = false
        for (let peek = i + 1; peek < lines.length && peek <= i + 3; peek++) {
          if (/^<\/cta>/.test(lines[peek])) {
            hasClosingCta = true
            break
          }
        }
        if (hasClosingCta) {
          const r = parseCtaTag(lines, i, t)
          html += r.html
          i = r.next
        } else {
          const r = parseCtaInline(lines, i, t)
          html += r.html
          i = r.next
        }
      }
      continue
    }
    // <compare>
    if (/^<compare\b/.test(line)) {
      const r = parseCompare(lines, i, t)
      html += r.html
      i = r.next
      continue
    }
    // <reading-path> 或 <reading-path />（支持属性如 margin="10px"）
    if (/^<reading-path\b/.test(line)) {
      const attrsStr = line.match(/^<reading-path\b([^>]*)>?/)?.[1] || ''
      const attrs = parseAttrs(attrsStr)
      const rendered = ReadingPath_DA01.render(attrs, pTitleLevel1List, t)
      html += rendered
      // 跳过闭合标签（如果有）
      if (
        /^<reading-path>/.test(line) &&
        i + 1 < lines.length &&
        /^<\/reading-path>/.test(lines[i + 1])
      ) {
        i += 2
      } else {
        i++
      }
      continue
    }
    // <title> 标签（通过 type 属性选择样式：DA01/DA02/...）
    if (/^<title\b/.test(line)) {
      const titleMatch = line.match(/^<title\b([^>]*)>([\s\S]*?)<\/title>/)
      if (titleMatch) {
        const attrs = parseAttrs(titleMatch[1])
        const body = titleMatch[2].trim()
        const type = (attrs.type || 'DA01').toUpperCase()
        if (type === 'DA02') {
          html += Title_DA02.render(attrs, body, t, md)
        } else {
          html += Title_DA01.render(attrs, body, t, md)
        }
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
        // 给根节点打个标记（不影响样式），分页时用它避免小节标题落在页底跟正文分家
        html += PTitle.render(attrs, body, t).replace('<section', '<section data-block="ptitle"')
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
        html += `<section><p style="margin:4px 0px">${inlineFormat(l, t, formulaMap)}</p></section>`
      })
      html += `</section>`
      continue
    }
    // <case-flow> 标签
    if (/^<case-flow\b/.test(line)) {
      const openMatch = line.match(/^<case-flow\b([^>]*)>/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      i++
      let body = ''
      while (i < lines.length && !/^<\/case-flow>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </case-flow>
      html += CaseFlow_DA01.render(attrs, body.trim(), t)
      continue
    }
    // 案例流（行内语法，无标签包裹时）
    if (/^-\s*\[案例\s*\d+\]/.test(line)) {
      const caseLines: string[] = []
      while (i < lines.length && /^-\s*\[案例\s*\d+\]/.test(lines[i])) {
        caseLines.push(lines[i])
        i++
      }
      html += CaseFlow_DA01.render({}, caseLines.join('\n'), t)
      continue
    }
    // <timeline> 标签
    if (/^<timeline\b/.test(line)) {
      const openMatch = line.match(/^<timeline\b([^>]*)>/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      i++
      let body = ''
      while (i < lines.length && !/^<\/timeline>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </timeline>
      html += Timeline_DA01.render(attrs, body.trim(), t)
      continue
    }
    // <slider> 标签
    if (/^<slider\b/.test(line)) {
      const openMatch = line.match(/^<slider\b([^>]*)>(.*)$/)
      const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
      // 单行模式：<slider ...>content</slider>
      if (openMatch && openMatch[2] && /<\/slider>\s*$/.test(openMatch[2])) {
        const body = openMatch[2].replace(/<\/slider>\s*$/, '').trim()
        html += Slider_DA01.render(attrs, body, t)
        i++
        continue
      }
      // 多行模式：内容在后续行
      let body = openMatch && openMatch[2] ? openMatch[2] + '\n' : ''
      i++
      while (i < lines.length && !/^<\/slider>/.test(lines[i])) {
        body += lines[i] + '\n'
        i++
      }
      i++ // skip </slider>
      html += Slider_DA01.render(attrs, body.trim(), t)
      continue
    }
    // <engage>
    if (/^<engage\b/.test(line)) {
      const attrs = parseAttrs(line)
      // type="DA02" 使用彩色图标版，否则默认 DA01
      if (attrs.type && attrs.type.toUpperCase() === 'DA02') {
        html += Engage_DA02.render(attrs, '', t)
      } else {
        html += Engage_DA01.render(attrs, '', t)
      }
      i++
      continue
    }

    // 标题 — Markdown 原生语法，不走 PTitle
    const h1m = line.match(/^#\s+(.+)/)
    if (h1m) {
      html += `<h1 style="margin:0px 0px 16px;font-size:24px;font-weight:700;color:var(--text-primary);line-height:1.4">${inlineFormat(h1m[1], t, formulaMap)}</h1>`
      i++
      continue
    }

    const h2m = line.match(/^##\s+(.+)/)
    if (h2m) {
      html += `<h2 style="margin:28px 0px 12px;font-size:20px;font-weight:700;color:var(--text-primary);line-height:1.4">${inlineFormat(h2m[1], t, formulaMap)}</h2>`
      i++
      continue
    }

    const h3m = line.match(/^###\s+(.+)/)
    if (h3m) {
      html += `<h3 style="margin:24px 0px 10px;font-size:17px;font-weight:700;color:var(--text-primary);line-height:1.4">${inlineFormat(h3m[1], t, formulaMap)}</h3>`
      i++
      continue
    }

    const h4m = line.match(/^####\s+(.+)/)
    if (h4m) {
      html += `<h4 style="margin:20px 0px 8px;font-size:15px;font-weight:700;color:var(--text-primary);line-height:1.4">${inlineFormat(h4m[1], t, formulaMap)}</h4>`
      i++
      continue
    }

    // 块级公式 $$...$$ — 优先取 formulaMap 中的预渲染 SVG
    if (/^\$\$/.test(line)) {
      // 辅助函数：获取 SVG 或降级为公式原文
      const resolveSvg = (f: string) => {
        const svg = formulaMap?.get(`b:${f}`)
        if (svg) return svg
        // 降级：显示公式原文，方便排查 formulaMap 缺失的情况
        return `<code style="display:inline-block;background:var(--hl-code-bg);padding:6px 12px;border-radius:6px;font-size:14px;font-family:SF Mono,Consolas,monospace;color:var(--hl-str);max-width:100%;overflow-x:auto;white-space:nowrap">$${esc(f)}$$</code>`
      }
      // 单行模式：$$formula$$
      const singleMatch = line.match(/^\$\$(.+?)\$\$/)
      if (singleMatch) {
        const formula = singleMatch[1].trim()
        html += `<section style="overflow-x:auto;margin:24px 0;color:var(--text-primary)"><section style="display:inline-block;white-space:nowrap;text-align:center;max-width:none!important">${resolveSvg(formula)}</section></section>`
        i++
        continue
      }
      // 多行模式：$$ 独占一行开头 → 收集行直到闭合 $$
      i++
      const formulaLines: string[] = []
      while (i < lines.length && !/^\$\$/.test(lines[i])) {
        formulaLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // 跳过闭合的 $$
      const formula = formulaLines.join('\n').trim()
      html += `<section style="overflow-x:auto;margin:24px 0;color:var(--text-primary)"><section style="display:inline-block;white-space:nowrap;text-align:center;max-width:none!important">${resolveSvg(formula)}</section></section>`
      continue
    }

    // 代码块：用微信自带的 code-snippet 结构（外层 <section> + <pre class="…code-snippet_nowrap">
    // + 每行一个 block <code>）。微信 code-snippet 会合并 <code> 内所有 <span>，因此 highlight
    // token 改用 <section> 标签（微信不合并 section），同时设 display:inline 保持同行排列。
    if (/^```/.test(line)) {
      const lang = line.replace(/^`+/, '').trim() || 'text'
      i++
      const codeLines: string[] = []
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++ // 跳过结尾的 ```
      let codeInner = ''
      for (const ln of codeLines) {
        const lead = (ln.match(/^[ \t]*/) || [''])[0]
        const indent = lead.replace(/\t/g, '  ').replace(/ /g, '&nbsp;')
        const rest = ln.slice(lead.length)
        const hl = rest ? highlightLine(rest, lang).replace(/<\/span> <span/g, '</span>&nbsp;<span') : ''
        const body = indent + hl || '&nbsp;'
        codeInner += `<section leaf="" style="white-space:nowrap">${body}</section>`
      }
      html += `<section data-lang="${esc(lang)}" style="white-space:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;background:rgb(30,30,46);color:rgb(205,214,244);padding:14px 16px;border-radius:8px;margin:24px 0;font-size:12.5px;line-height:1.6;font-family:SFMono-Regular,Consolas,Monaco,monospace">${codeInner}</section>`
      continue
    }

    // 表格
    if (line.indexOf('|') >= 0 && i + 1 < lines.length && /\|[\s-:]+\|/.test(lines[i + 1])) {
      // 先掐掉首尾装饰性管道再 split，这样中间的空格会原样保留为 ''
      let headerLine = line.trim()
      if (headerLine.startsWith('|')) headerLine = headerLine.slice(1)
      if (headerLine.endsWith('|')) headerLine = headerLine.slice(0, -1)
      let headers = headerLine.split('|').map((s) => s.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].indexOf('|') >= 0 && lines[i].trim() !== '') {
        let cellLine = lines[i].trim()
        if (cellLine.startsWith('|')) cellLine = cellLine.slice(1)
        if (cellLine.endsWith('|')) cellLine = cellLine.slice(0, -1)
        const cells = cellLine.split('|').map((s) => s.trim())
        rows.push(cells)
        i++
      }
      html += `<section style="margin:24px 0px;box-shadow:rgba(15,23,42,0.05) 0px 10px 24px;border-radius:14px;border:1px solid rgba(229,231,235,0.9);overflow:hidden;background:linear-gradient(135deg,rgb(248,250,252) 0%,rgb(238,244,251) 100%)"><section style="padding:28px 20px;background:rgba(255,255,255,0.92)"><section class="tableWrapper" style="width:100%"><table style="border:0px;border-collapse:collapse;table-layout:fixed;min-width:115px;width:100%"><thead><tr>`
      headers.forEach((h) => {
        html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left;font-size:13px;font-weight:700;color:rgb(51,65,85)">${inlineFormat(h, t, formulaMap)}</td>`
      })
      html += `</tr></thead><tbody>`
      rows.forEach((r) => {
        html += `<tr>`
        r.forEach((c) => {
          html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left;font-size:13px;color:rgb(51,65,85)">${inlineFormat(c, t, formulaMap)}</td>`
        })
        html += `</tr>`
      })
      html += `</tbody></table></section></section></section>`
      continue
    }

    // 无序列表
    if (/^[-*+]\s/.test(line)) {
      html += `<section style="margin:24px 0px;padding-left:24px">`
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const li = lines[i].replace(/^[-*+]\s/, '')
        const cb = li.match(/^\[([ x])\]\s*(.*)/)
        if (cb) {
          const isChecked = cb[1] === 'x'
          const boxStyle = isChecked
            ? `background:${t.accent};border-color:${t.accent}`
            : `border-color:${t.border}`
          const uncheckedBorder = t.border === '#e2e8f0' ? '#94a3b8' : t.border
          const checkSvg = isChecked
            ? '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 9l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="${uncheckedBorder}" stroke-width="1.5" fill="none"/></svg>`
          html += `<section style="margin:5px 0px"><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;${isChecked ? `background:${t.accent};border-radius:4px` : ''}">${checkSvg}</span><span>${inlineFormat(cb[2], t, formulaMap)}</span></span></section>`
        } else {
          html += `<section style="margin:5px 0px">${inlineFormat(li, t, formulaMap)}</section>`
        }
        i++
      }
      html += `</section>`
      continue
    }

    // 有序列表
    if (/^\d+\.\s/.test(line)) {
      let idx = 1
      html += `<section style="margin:10px 0px;padding-left:24px">`
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const content = lines[i].replace(/^\d+\.\s/, '')
        html += `<section style="margin:5px 0px"><span style="color:rgb(148,163,184);font-weight:700;margin-right:6px">${idx}.</span>${inlineFormat(content, t, formulaMap)}</section>`
        idx++
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
        html += `<section style="max-height:${parts[1] || '250px'};overflow-y:auto;border-radius:8px;margin:24px 0px"><img src="${esc(src)}" alt="${esc(alt)}" style="width:${parts[0] || '100%'};display:block"></section>`
      } else {
        html += `<img src="${esc(src)}" alt="${esc(alt)}" style="max-width:100%;border-radius:6px;margin:24px 0px;display:block">`
      }
      i++
      continue
    }

    // <chart>
    if (/^<chart\b/.test(line.trim())) {
      const attrs = parseAttrs(line.trim())
      html += Chart_DA01.render(attrs, '', t)
      i++
      continue
    }

    // <img>
    if (/^<img\s/.test(line.trim())) {
      const attrs = parseAttrs(line)
      html += Img_DA01.render(attrs, '', t)
      i++
      continue
    }

    // 普通段落
    html += `<section style="margin:0px 0px 24px"><p style="margin:0px;font-size:16px;color:var(--text-primary);line-height:1.85;text-align:justify;overflow-wrap:break-word;word-break:break-all">${inlineFormat(line, t, formulaMap)}</p></section>`
    i++
  }

  // 添加脚注参考资料
  if (footnotes.length > 0) {
    html += `<section style="margin:32px 0px 0px;padding-top:20px;border-top:1px solid ${t.border}">`
    html += `<h2 style="margin:0px 0px 16px;font-size:18px;font-weight:700;color:var(--text-primary);line-height:1.4">参考资料</h2>`
    html += `<section style="font-size:14px;color:var(--text-secondary);line-height:1.8">`
    footnotes.forEach((fn, idx) => {
      html += `<p style="margin:6px 0px"><span style="color:${t.accent};font-weight:600">[${idx + 1}]</span> ${leaf(fn.desc)}：<a href="${esc(fn.url)}" style="color:${t.accent};word-break:break-all">${esc(fn.url)}</a></p>`
    })
    html += `</section></section>`
  }

  return html
}
