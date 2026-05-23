<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { parseMarkdown } from '@/utils/markdownParser'
import type { ThemeColors } from '@/composables/useTheme'
import { useDarkMode } from '@/composables/useDarkMode'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import { components } from '@/editor-components'

const { mode: darkMode, setMode: setDarkMode } = useDarkMode()
const visible = ref(false)

const demoColors: ThemeColors = {
  accent: '#6c5ce7',
  dark: '#5a4bd1',
  light: '#f0edff',
  border: '#e5e7eb',
  rgb: '108,92,231',
}

const componentExamples = ref<Array<{
  id: string
  name: string
  description: string
  example: string
  rendered: string
  idSuffix: string
}>>([])

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
  componentExamples.value = components.map(comp => ({
    id: comp.id,
    name: comp.name,
    description: comp.description || '',
    example: comp.example || '',
    rendered: comp.example ? parseMarkdown(comp.example, demoColors) : '',
    idSuffix: comp.id.split('_').slice(1).join('_')
  }))
})

function copySyntax(code: string) {
  navigator.clipboard.writeText(code)
}

function onMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  card.style.setProperty('--mouse-x', `${x}px`)
  card.style.setProperty('--mouse-y', `${y}px`)
}
</script>

<template>
  <div class="showcase-page" :class="{ 'opacity-100': visible, 'opacity-0': !visible }">
    <!-- Header -->
    <header class="header-blur sticky top-0 z-50 backdrop-blur-xl">
      <div class="mx-auto max-w-[1100px] flex items-center px-4 sm:px-8 py-3.5">
        <router-link to="/" class="flex items-center gap-2.5 no-underline shrink-0 logo-link">
          <svg class="logo-icon" viewBox="0 0 24 24" width="26" height="26">
            <rect width="24" height="24" rx="6" fill="#6c5ce7" />
            <text x="3" y="17" font-family="Arial" font-size="10.5" font-weight="bold" fill="white">RM</text>
          </svg>
          <span class="text-[17px] font-bold text-[#111] tracking-tight logo-text">R-Markdown</span>
        </router-link>

        <nav class="nav-pill relative hidden sm:flex items-center rounded-full bg-black/5 px-0.5 py-0.5 ml-auto">
          <router-link to="/" class="nav-link relative z-10 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[14px] font-medium text-[#555] no-underline transition-colors hover:text-[#111]">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l7-8 7 8"/></svg>
            首页
          </router-link>
          <span class="w-1 h-1 rounded-full bg-black/20 relative z-10 mx-1"></span>
          <router-link to="/editor" class="nav-link relative z-10 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[14px] font-medium text-[#555] no-underline transition-colors hover:text-[#111]">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 7h6M7 10h4"/></svg>
            编辑器
          </router-link>
        </nav>

        <DarkModeToggle :mode="darkMode" @select="setDarkMode" class="shrink-0 ml-auto sm:ml-3" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="px-4 sm:px-8 py-8 sm:py-12">
      <div class="mx-auto max-w-[1100px]">
        <div class="mb-8 sm:mb-12">
          <h1 class="text-[28px] sm:text-[40px] font-extrabold tracking-tight text-[#111] m-0 mb-2">
            组件预览
          </h1>
          <p class="text-base sm:text-[19px] text-[#888] m-0">
            悬停卡片查看组件用法
          </p>
        </div>

        <!-- Components Waterfall -->
        <div class="waterfall">
          <div
            v-for="comp in componentExamples"
            :key="comp.id"
            class="spotlight-card"
            @mousemove="onMouseMove"
          >
            <!-- 高光层 -->
            <div class="spotlight-glow"></div>

            <!-- 正面：渲染预览 -->
            <div class="card-front">
              <div class="p-6">
                <div v-if="comp.rendered" v-html="comp.rendered" class="preview-content"></div>
                <div v-else class="text-[13px] text-[#ccc] italic py-8 text-center">暂无示例</div>
              </div>
            </div>

            <!-- 悬浮层：语法用法 -->
            <div v-if="comp.example" class="card-overlay">
              <div class="overlay-content">
                <div class="overlay-header">
                  <span class="overlay-title">{{ comp.name }} <span class="overlay-id">{{ comp.idSuffix }}</span></span>
                  <button class="copy-btn" @click.stop="copySyntax(comp.example)">
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="5" y="5" width="9" height="9" rx="1.5"/>
                      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"/>
                    </svg>
                    复制
                  </button>
                </div>
                <pre class="syntax-code"><code>{{ comp.example }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="px-4 sm:px-8 py-6 border-t border-black/[0.06]">
      <div class="mx-auto max-w-[1100px] text-center">
        <p class="text-[13px] text-[#bbb]">© 2026 R-Markdown · Markdown to WeChat</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.showcase-page {
  min-height: 100vh;
  background: #f5f5f7;
  transition: opacity 0.3s ease;
}

.logo-link {
  cursor: pointer;
}

/* ── 瀑布流 ── */
.waterfall {
  columns: 2;
  column-gap: 1.5rem;
}

@media (max-width: 1023px) {
  .waterfall {
    columns: 1;
  }
}

/* ── 聚光灯卡片 ── */
.spotlight-card {
  break-inside: avoid;
  margin-bottom: 1.5rem;
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  cursor: default;
  --mouse-x: 50%;
  --mouse-y: 50%;
}

/* 高光层：从鼠标位置扩散的径向渐变 */
.spotlight-glow {
  position: absolute;
  inset: 0;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.35s ease;
  background: radial-gradient(
    350px circle at var(--mouse-x) var(--mouse-y),
    rgba(108, 92, 231, 0.15),
    rgba(108, 92, 231, 0.05) 40%,
    transparent 70%
  );
  pointer-events: none;
}

.spotlight-card:hover .spotlight-glow {
  opacity: 1;
}

/* 正面渲染预览 */
.card-front {
  position: relative;
  z-index: 1;
  transition: opacity 0.35s ease, filter 0.35s ease;
}

.spotlight-card:hover .card-front {
  opacity: 0.15;
  filter: blur(2px);
}

/* 悬浮语法层 */
.card-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.spotlight-card:hover .card-overlay {
  opacity: 1;
  pointer-events: auto;
}

.overlay-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.overlay-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.overlay-id {
  color: #6c5ce7;
  font-weight: 500;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(108, 92, 231, 0.08);
  color: #6c5ce7;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #6c5ce7;
  color: white;
  border-color: #6c5ce7;
}

.syntax-code {
  flex: 1;
  margin: 0;
  padding: 1rem;
  background: #1e1e2e;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #e0e0e0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-content :deep(section) {
  transition: opacity 0.15s ease;
}
</style>

<style>
/* 深色模式 */
[data-theme='dark'] .showcase-page {
  background: #111114;
}
[data-theme='dark'] header {
  background: rgba(17, 17, 20, 0.8) !important;
}
[data-theme='dark'] .logo-text {
  color: #f0f0f0;
}
[data-theme='dark'] .nav-pill {
  background: rgba(255, 255, 255, 0.08) !important;
}
[data-theme='dark'] .nav-link {
  color: #aaa !important;
}
[data-theme='dark'] .nav-link:hover {
  color: #f0f0f0 !important;
}
[data-theme='dark'] .spotlight-card {
  background: #1a1a1e;
  border-color: rgba(255, 255, 255, 0.08);
}
[data-theme='dark'] .spotlight-glow {
  background: radial-gradient(
    350px circle at var(--mouse-x) var(--mouse-y),
    rgba(167, 139, 250, 0.2),
    rgba(167, 139, 250, 0.06) 40%,
    transparent 70%
  );
}
[data-theme='dark'] .overlay-title {
  color: rgba(255, 255, 255, 0.85);
}
[data-theme='dark'] .overlay-id {
  color: #a78bfa;
}
[data-theme='dark'] .copy-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(167, 139, 250, 0.1);
  color: #a78bfa;
}
[data-theme='dark'] .copy-btn:hover {
  background: #a78bfa;
  color: #1a1a1e;
  border-color: #a78bfa;
}
[data-theme='dark'] footer {
  border-color: rgba(255, 255, 255, 0.06);
}
[data-theme='dark'] footer p {
  color: #555;
}
</style>
