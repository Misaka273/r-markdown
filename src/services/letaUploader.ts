/**
 * 乐塔图床上传服务
 *
 * 将图片上传到乐塔图床，返回公开访问链接。
 * API 文档：https://www.ltimg.com/api/v2
 *
 * Dev 模式下通过 Vite proxy（/api/leta → https://www.ltimg.com）绕过 CORS，
 * 生产环境（Tauri）直连 API 域名。
 */

const API_BASE = import.meta.env.DEV ? '/api/leta' : 'https://www.ltimg.com'
const UPLOAD_URL = import.meta.env.DEV
  ? '/api/leta/v2/upload'
  : 'https://www.ltimg.com/api/v2/upload'

export interface LetaUploadConfig {
  token: string
  storageId?: string // 默认 "1"
}

export interface UploadResult {
  url: string
}

/**
 * 上传图片到乐塔图床
 */
export async function uploadToLeta(
  file: File,
  config: LetaUploadConfig,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('storage_id', config.storageId || '1')
  formData.append('is_public', '0')

  const result = await new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    xhr.setRequestHeader('Authorization', `Bearer ${config.token}`)
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr)
      } else {
        let message = `HTTP ${xhr.status}`
        try {
          const errBody = JSON.parse(xhr.responseText)
          message = (errBody as any).message || message
        } catch {}
        if (xhr.status === 401) reject(new Error('Token 无效或未授权'))
        else if (xhr.status === 403) reject(new Error('接口功能已关闭或无权限'))
        else if (xhr.status === 429) reject(new Error('请求过于频繁，请稍后重试'))
        else if (xhr.status >= 500) reject(new Error('服务端异常，请稍后重试'))
        else reject(new Error(`上传失败 (${xhr.status}): ${message}`))
      }
    }

    xhr.onerror = () => reject(new Error('网络请求失败'))
    xhr.ontimeout = () => reject(new Error('上传超时'))
    xhr.timeout = 120000

    xhr.send(formData)
  })

  const body = JSON.parse(result.responseText)
  if (body.status !== 'success' || !body.data?.public_url) {
    throw new Error(body.message || '上传失败')
  }

  return { url: body.data.public_url }
}

/**
 * 测试图床连接
 *
 * 向 API 基地址发起 GET 请求验证 Token 有效性（upload 端点仅支持 POST，故不能直接测上传接口）。
 */
export async function testConnection(config: LetaUploadConfig): Promise<boolean> {
  const response = await fetch(`${API_BASE}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token 无效或未授权')
    if (response.status === 403) throw new Error('接口功能已关闭或无权限')
    throw new Error(`连接失败 (${response.status})`)
  }

  return true
}
