/**
 * 从 markdown 内容提取文章标题，按三级优先级：
 * 1. <title> 组件 body
 * 2. Front-matter title 字段
 * 3. Markdown # 一级标题
 * 命中即止，均未命中返回 null。
 */
export function extractTitle(markdown: string): string | null {
  // 1. 优先从 <title> 组件 body 提取
  const titleMatch = markdown.match(
    /^<title\b[^>]*>([\s\S]*?)<\/title>/m,
  )
  if (titleMatch && titleMatch[1].trim()) {
    return titleMatch[1].trim()
  }

  // 2. 其次从 front-matter 的 title 字段提取
  const fmTitleMatch = markdown.match(
    /^---\s*\n(?:[\s\S]*?\n)?title:\s*(.+?)(?:\n|$)/m,
  )
  if (fmTitleMatch && fmTitleMatch[1].trim()) {
    return fmTitleMatch[1].trim()
  }

  // 3. 最后从 # 一级标题提取
  const h1Match = markdown.match(/^#\s+(.+)/m)
  if (h1Match && h1Match[1].trim()) {
    return h1Match[1].trim()
  }

  return null
}

/**
 * 去除文件名非法字符（/ \ : * ? " < > |）
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim()
}
