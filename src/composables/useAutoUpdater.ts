import { onMounted } from 'vue'

const isTauri = import.meta.env.VITE_TAURI === 'true'

/**
 * Tauri 自动更新检查（仅在桌面客户端环境下生效，不影响网页版）
 * 启动后延迟 3 秒静默检查，有更新时弹窗询问用户是否安装。
 */
export function useAutoUpdater() {
  onMounted(async () => {
    if (!isTauri) return

    setTimeout(async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()
        if (!update) return // 无更新

        const yes = confirm(`发现新版本 ${update.version}，是否立即安装？`)
        if (!yes) return

        await update.downloadAndInstall()
      } catch {
        // 静默失败，不影响正常使用
      }
    }, 3000)
  })
}
