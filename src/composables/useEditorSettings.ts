import { ref, watch } from 'vue'
import { getSetting, setSetting } from '@/config/settings'

/** 自动保存开关 */
export const autoSaveEnabled = ref(getSetting<boolean>('autoSave'))
/** 自动保存间隔（秒） */
export const autoSaveInterval = ref(getSetting<number>('autoSaveInterval'))

watch(autoSaveEnabled, (v) => setSetting('autoSave', v))
watch(autoSaveInterval, (v) => setSetting('autoSaveInterval', v))
