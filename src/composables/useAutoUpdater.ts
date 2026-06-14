import { onMounted, ref } from 'vue'
import type { Update } from '@tauri-apps/plugin-updater'

const isTauri = import.meta.env.VITE_TAURI === 'true'

export interface CheckResult {
  update: Update | null
  error: string | null
}

/** 启动自动检查时发现的新版本，组件可 watch 此 ref 弹窗 */
export const autoUpdatePending = ref<Update | null>(null)

/**
 * 手动检查更新。返回 `update === null` 表示无更新。
 * 可在任意组件中调用。
 */
export async function checkForUpdates(): Promise<CheckResult> {
  if (!isTauri) return { update: null, error: '当前环境不支持自动更新' }

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await Promise.race([
      check(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('检查更新超时，请检查网络后重试')), 15000)
      ),
    ])
    return { update, error: null }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '检查更新失败'
    return { update: null, error: msg }
  }
}

function autoCheck() {
  setTimeout(async () => {
    const { update } = await checkForUpdates()
    if (update) autoUpdatePending.value = update
  }, 3000)
}

/**
 * Tauri 自动更新检查（仅在桌面客户端环境下生效，不影响网页版）
 * 启动后延迟 3 秒静默检查，有更新时通过 autoUpdatePending ref 通知 UI 弹窗。
 */
export function useAutoUpdater() {
  onMounted(() => {
    if (isTauri) autoCheck()
  })
}
