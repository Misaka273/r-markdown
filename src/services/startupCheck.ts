/**
 * 启动时检测 Documents/R-Markdown/config.json 是否存在。
 * 仅当磁盘配置存在 且 localStorage 中无数据（首次启动/重装）时才弹窗。
 */
import { reactive } from 'vue'
import { diskConfigExists, deleteDiskConfig } from './configPersistence'
import { restoreFromDiskConfig } from '@/config/settings'

export const startupState = reactive({
  /** 是否显示恢复配置弹窗 */
  showRestorePrompt: false,
  /** 弹窗是否已关闭（无论用户选了是/否） */
  resolved: false,
})

function isLocalStorageEmpty(): boolean {
  // 检查是否有任何 r-markdown- 前缀的 key
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith('r-markdown-')) {
      return false
    }
  }
  return true
}

export async function checkForOldConfig() {
  const isDesktop = import.meta.env.VITE_TAURI === 'true'
  if (!isDesktop) {
    startupState.resolved = true
    return
  }

  // 必须在任何 await 之前同步判断，否则 initSettings() 已写入默认值
  const empty = isLocalStorageEmpty()
  if (!empty) {
    startupState.resolved = true
    return
  }

  try {
    const exists = await diskConfigExists()
    if (exists) {
      startupState.showRestorePrompt = true
    } else {
      startupState.resolved = true
    }
  } catch {
    startupState.resolved = true
  }
}

export async function handleRestore(restore: boolean) {
  try {
    if (restore) {
      await restoreFromDiskConfig()
      // 恢复完成后刷新页面，让所有组件用新值重新初始化
      window.location.reload()
    } else {
      await deleteDiskConfig()
      startupState.showRestorePrompt = false
      startupState.resolved = true
    }
  } catch {
    startupState.showRestorePrompt = false
    startupState.resolved = true
  }
}
