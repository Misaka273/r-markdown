/**
 * GitHub 图床上传服务
 *
 * 将图片上传到 GitHub 仓库，返回 jsDelivr CDN 链接。
 * 原生 fetch 实现，无需额外依赖。
 */

export interface GitHubUploadConfig {
  repo: string   // 格式 "用户名/仓库名"
  token: string
  branch: string // 默认 "main"
}

export interface UploadResult {
  url: string
}

/**
 * File → Data URL → 纯 base64（去除 data URI 前缀）
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      if (!base64) {
        reject(new Error('文件格式不支持'))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件扩展名
 */
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.substring(idx) : '.png'
}

/**
 * 生成上传路径：r-markdown/YYYY/MM/时间戳.后缀
 */
function generatePath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const ts = Date.now()
  const ext = getExtension(filename)
  return `r-markdown/${year}/${month}/${ts}${ext}`
}

/**
 * 上传图片到 GitHub 仓库，返回 jsDelivr CDN 链接
 */
export async function uploadToGitHub(
  file: File,
  config: GitHubUploadConfig,
): Promise<UploadResult> {
  const [owner, repo] = config.repo.split('/')
  if (!owner || !repo) {
    throw new Error('仓库格式错误，应为 用户名/仓库名')
  }

  const path = generatePath(file.name)
  const content = await fileToBase64(file)

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const body = JSON.stringify({
    message: 'Upload via R-Markdown',
    content,
    branch: config.branch,
  })

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const message = (errBody as any).message || `HTTP ${response.status}`
    if (response.status === 401) {
      throw new Error('Token 无效或无权限')
    }
    if (response.status === 404) {
      throw new Error('仓库不存在，请检查 用户名/仓库名')
    }
    if (response.status === 422) {
      throw new Error(`上传失败: ${message}`)
    }
    throw new Error(`上传失败 (${response.status}): ${message}`)
  }

  const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${config.branch}/${path}`

  return { url: jsdelivrUrl }
}

/**
 * 测试图床连接：尝试获取仓库信息
 */
export async function testConnection(config: GitHubUploadConfig): Promise<boolean> {
  const [owner, repo] = config.repo.split('/')
  if (!owner || !repo) {
    throw new Error('仓库格式错误，应为 用户名/仓库名')
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token 无效或无权限')
    }
    if (response.status === 404) {
      throw new Error('仓库不存在')
    }
    throw new Error(`连接失败 (${response.status})`)
  }

  return true
}
