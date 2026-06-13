import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { preloadMathJax } from './utils/mathRenderer'
import './styles/style.css'

// 预加载 MathJax CDN，减少首次渲染公式的等待
preloadMathJax()

// 桌面客户端启动显示 loading，Vue 挂载后移除，避免白屏闪烁
const isTauri = import.meta.env.VITE_TAURI === 'true'
if (isTauri) {
  const loading = document.getElementById('app-loading')
  if (loading) {
    loading.setAttribute('style', 'display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;color:#9ca3af;font-size:14px;background:#f5f5f7')
  }
}

const mountStart = performance.now()

createApp(App).use(router).mount('#app')

if (isTauri) {
  const loading = document.getElementById('app-loading')
  if (loading) {
    const minDuration = 300
    const elapsed = performance.now() - mountStart
    const delay = Math.max(0, minDuration - elapsed)
    setTimeout(() => {
      loading.style.opacity = '0'
      loading.style.transition = 'opacity 0.15s'
      setTimeout(() => loading.remove(), 150)
    }, delay)
  }
}
