/**
 * 配置持久化 —— 桌面端专用。
 * 每次 setSetting() 后自动同步到 Documents/R-Markdown/config.json。
 * 重装后启动时检测到旧配置则弹窗询问是否恢复。
 */
import { documentDir } from '@tauri-apps/api/path'
import { exists, mkdir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs'

const DIR = 'R-Markdown'
const FILE = 'config.json'

async function getConfigPath(): Promise<string> {
  const doc = await documentDir()
  return `${doc}/${DIR}/${FILE}`
}

async function ensureDir(): Promise<void> {
  const doc = await documentDir()
  const dir = `${doc}/${DIR}`
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true })
  }
}

/** 磁盘上是否存在旧配置 */
export async function diskConfigExists(): Promise<boolean> {
  try {
    const path = await getConfigPath()
    return await exists(path)
  } catch {
    return false
  }
}

/** 读取磁盘配置 */
export async function readDiskConfig(): Promise<Record<string, unknown>> {
  const path = await getConfigPath()
  const text = await readTextFile(path)
  return JSON.parse(text)
}

/** 写入磁盘配置（写前确保目录存在） */
export async function writeDiskConfig(data: Record<string, unknown>): Promise<void> {
  await ensureDir()
  const path = await getConfigPath()
  await writeTextFile(path, JSON.stringify(data, null, 2))
}

/** 删除磁盘配置 */
export async function deleteDiskConfig(): Promise<void> {
  try {
    const path = await getConfigPath()
    if (await exists(path)) {
      await remove(path)
    }
  } catch {
    // 删不掉就算了，不影响功能
  }
}
