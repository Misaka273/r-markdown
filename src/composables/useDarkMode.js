import { ref, computed, watch } from 'vue'
const STORAGE_KEY = 'wechat-md-dark-mode'
const mode = ref(localStorage.getItem(STORAGE_KEY) || 'system')
const systemDark = ref(false)
// 初始化系统监听（只执行一次）
let initialized = false
function initSystemListener() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = mq.matches
  mq.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
}
const isDark = computed(() => {
  if (mode.value === 'system') return systemDark.value
  return mode.value === 'dark'
})
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
export function useDarkMode() {
  initSystemListener()
  // 监听 isDark 变化，自动应用
  watch(isDark, (v) => applyTheme(v), { immediate: true })
  function setMode(m) {
    mode.value = m
    localStorage.setItem(STORAGE_KEY, m)
  }
  return { mode, isDark, setMode }
}
