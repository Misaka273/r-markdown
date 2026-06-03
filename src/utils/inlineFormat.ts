import type { ThemeColors } from '../composables/useTheme'
import { esc, leaf, lightenHex } from './helpers'

export function inlineFormat(text: string, t: ThemeColors): string {
  // 脚注占位符 __FN_N__（渲染为带下划线的文字 + 上标数字）
  // 格式：__FN_N__|显示文字，其中显示文字由 markdownParser 传入
  text = text.replace(
    /__FN_(\d+)__\|([^|]+)\|/g,
    (_m, p1: string, label: string) =>
      `<span style="color:${t.accent};text-decoration:underline;text-decoration-style:dashed;text-underline-offset:3px;cursor:pointer">${leaf(label)}</span><sup style="color:${t.accent};font-size:0.75em;font-weight:600">[${parseInt(p1) + 1}]</sup>`,
  )
  // 兼容没有显示文字的格式
  text = text.replace(
    /__FN_(\d+)__/g,
    (_m, p1: string) =>
      `<sup style="color:${t.accent};font-weight:600;cursor:pointer">[${parseInt(p1) + 1}]</sup>`,
  )
  // ==渐变背景==
  text = text.replace(
    /==([^=]+)==/g,
    (_m, p1: string) =>
      `<span style="background:linear-gradient(120deg,rgba(${t.rgb},0.1) 0%,rgba(${t.rgb},0.16) 100%);padding:0px 6px;border-radius:4px;font-weight:700;color:${t.accent}">${leaf(p1)}</span>`,
  )
  // !!胶囊文字!!
  text = text.replace(
    /!!([^!]+)!!/g,
    (_m, p1: string) =>
      `<span style="display:inline-block;padding:0 5px;border-radius:20px;font-size:14px;font-weight:600;background:${t.light};color:${t.accent};border:1px solid ${t.border}">${leaf(p1)}</span>`,
  )
  // ^^加重强调^^
  text = text.replace(
    /\^\^([^^]+)\^\^/g,
    (_m, p1: string) => `<strong style="color:${t.accent}">${leaf(p1)}</strong>`,
  )
  // ::柔光重点::
  text = text.replace(/::([^:]+)::/g, (_m, p1: string) => {
    const light = lightenHex(t.accent, 0.15)
    return `<span style="color:${light};font-weight:700">${leaf(p1)}</span>`
  })
  // __下划线__
  text = text.replace(
    /__([^_]+)__/g,
    (_m, p1: string) =>
      `<span style="text-decoration:underline;text-decoration-color:${t.accent};text-underline-offset:3px">${leaf(p1)}</span>`,
  )
  // ~~删除线~~
  text = text.replace(
    /~~([^~]+)~~/g,
    (_m, p1: string) => `<del style="color:#9ca3af">${leaf(p1)}</del>`,
  )
  // ~下标~
  text = text.replace(/~([^~]+)~/g, (_m, p1: string) => `<sub>${leaf(p1)}</sub>`)
  // ^上标^
  text = text.replace(/\^([^^]+)\^/g, (_m, p1: string) => `<sup>${leaf(p1)}</sup>`)
  // **粗体**
  text = text.replace(/\*\*([^*]+)\*\*/g, (_m, p1: string) => `<strong>${leaf(p1)}</strong>`)
  // *斜体*
  text = text.replace(/\*([^*]+)\*/g, (_m, p1: string) => `<em>${leaf(p1)}</em>`)
  // `行内代码`
  text = text.replace(
    /`([^`]+)`/g,
    (_m, p1: string) =>
      `<code style="background:#f0f0f5;padding:2px 6px;border-radius:4px;font-size:13px;font-family:SF Mono,Consolas,monospace;color:#e83e8c">${leaf(p1)}</code>`,
  )
  // 图片 ![alt](src)[size]
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/g,
    (_m, alt: string, src: string, size?: string) => {
      if (size) {
        const parts = size.split(/\s+/)
        const w = parts[0] || '100%'
        const h = parts[1] || '250px'
        return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:${w};max-height:${h};border-radius:6px;display:block">`
      }
      return `<img src="${esc(src)}" alt="${esc(alt)}" style="max-width:100%;border-radius:6px;display:block">`
    },
  )
  // 链接 [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, p1: string, p2: string) => `<a href="${p2}" style="color:${t.accent}">${leaf(p1)}</a>`,
  )
  return text
}
