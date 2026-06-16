/**
 * 应用默认配置。新增设置项只需在此文件加一行，
 * initSettings() 会自动为旧用户补上缺失的默认值。
 * platforms 不传表示全平台适用。
 */

export interface SettingDef {
  default: unknown
  /** 适用平台，不传表示全平台 */
  platforms?: ('desktop' | 'web')[]
}

export const DEFAULT_SETTINGS: Record<string, SettingDef> = {
  /** 启动时是否自动检查更新（仅桌面端） */
  autoUpdate: { default: true, platforms: ['desktop'] },
  /** 页面缩放百分比（仅桌面端） */
  pageZoom: { default: 100, platforms: ['desktop'] },
  /** 是否启用自动保存（仅桌面端） */
  autoSave: { default: true, platforms: ['desktop'] },
  /** 自动保存间隔（秒，仅桌面端） */
  autoSaveInterval: { default: 0.5, platforms: ['desktop'] },
  /** GitHub 图床仓库，格式 用户名/仓库名 */
  githubRepo: { default: '' },
  /** GitHub Personal Access Token */
  githubToken: { default: '' },
  /** GitHub 仓库分支 */
  githubBranch: { default: 'main' },
}
