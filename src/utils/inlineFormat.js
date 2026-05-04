import { esc, leaf, lightenHex } from './helpers'
export function inlineFormat(text, t) {
  // ==渐变背景==
  text = text.replace(
    /==([^=]+)==/g,
    (_m, p1) =>
      `<span style="background:linear-gradient(120deg,rgba(${t.rgb},0.1) 0%,rgba(${t.rgb},0.16) 100%);color:${t.accent};padding:0px 6px;border-radius:4px;font-weight:700">${leaf(p1)}</span>`,
  )
  // !!胶囊文字!!
  text = text.replace(
    /!!([^!]+)!!/g,
    (_m, p1) =>
      `<span style="display:inline-block;padding:0 5px;border-radius:20px;font-size:14px;font-weight:600;background:${t.light};color:${t.accent};border:1px solid ${t.border}">${leaf(p1)}</span>`,
  )
  // ^^加重强调^^
  text = text.replace(
    /\^\^([^^]+)\^\^/g,
    (_m, p1) => `<strong style="color:${t.accent}">${leaf(p1)}</strong>`,
  )
  // ::柔光重点::
  text = text.replace(/::([^:]+)::/g, (_m, p1) => {
    const light = lightenHex(t.accent, 0.15)
    return `<span style="color:${light};font-weight:700">${leaf(p1)}</span>`
  })
  // __下划线__
  text = text.replace(
    /__([^_]+)__/g,
    (_m, p1) =>
      `<span style="text-decoration:underline;text-decoration-color:${t.accent};text-underline-offset:3px">${leaf(p1)}</span>`,
  )
  // ~~删除线~~
  text = text.replace(/~~([^~]+)~~/g, (_m, p1) => `<del style="color:#9ca3af">${leaf(p1)}</del>`)
  // **粗体**
  text = text.replace(/\*\*([^*]+)\*\*/g, (_m, p1) => `<strong>${leaf(p1)}</strong>`)
  // *斜体*
  text = text.replace(/\*([^*]+)\*/g, (_m, p1) => `<em>${leaf(p1)}</em>`)
  // `行内代码`
  text = text.replace(
    /`([^`]+)`/g,
    (_m, p1) =>
      `<code style="background:#f0f0f5;padding:2px 6px;border-radius:4px;font-size:13px;font-family:SF Mono,Consolas,monospace;color:#e83e8c">${leaf(p1)}</code>`,
  )
  // 图片 ![alt](src)[size]
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/g, (_m, alt, src, size) => {
    if (size) {
      const parts = size.split(/\s+/)
      const w = parts[0] || '100%'
      const h = parts[1] || '250px'
      return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:${w};max-height:${h};border-radius:6px;display:block">`
    }
    return `<img src="${esc(src)}" alt="${esc(alt)}" style="max-width:100%;border-radius:6px;display:block">`
  })
  // 链接 [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, p1, p2) => `<a href="${p2}" style="color:${t.accent}">${leaf(p1)}</a>`,
  )
  return text
}
