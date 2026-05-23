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
}>>([])

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
  componentExamples.value = components.map(comp => ({
    id: comp.id,
    name: comp.name,
    description: comp.description || '',
    example: comp.example || '',
    rendered: comp.example ? parseMarkdown(comp.example, demoColors) : ''
  }))
})

function copySyntax(code: string) {
  navigator.clipboard.writeText(code)
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
            悬停卡片查看组件语法
          </p>
        </div>

                <!-- Components Waterfall -->
        <div class="waterfall">
          <div
            v-for="comp in componentExamples"
            :key="comp.id"
            class="showcase-card group"
          >
                        <!-- 渲染预览（始终完整展示） -->
            <div class="card-preview bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-visible">
              <div class="p-6">
                <div v-if="comp.rendered" v-html="comp.rendered" class="preview-content"></div>
                <div v-else class="text-[13px] text-[#ccc] italic py-8 text-center">暂无示例</div>
              </div>
            </div>

            <!-- 悬停语法遮罩 -->
            <div v-if="comp.example" class="syntax-overlay">
              <div class="syntax-header">
                <span class="text-[13px] text-white/80 font-semibold">{{ comp.name }} <span class="text-[#a78bfa]">{{ comp.id.split('_').slice(1).join('_') }}</span></span>
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

/* ── 卡片容器 ── */
.showcase-card {
  position: relative;
  cursor: default;
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

.card-preview {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease;
}

.showcase-card:hover .card-preview {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(108, 92, 231, 0.12);
}

/* ── 语法遮罩 ── */
.syntax-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3f 100%);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  overflow: hidden;
}

.showcase-card:hover .syntax-overlay {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.syntax-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.syntax-code {
  flex: 1;
  margin: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.25);
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
[data-theme='dark'] .card-preview {
  background: #1a1a1e;
  border-color: rgba(255, 255, 255, 0.08);
}
[data-theme='dark'] footer {
  border-color: rgba(255, 255, 255, 0.06);
}
[data-theme='dark'] footer p {
  color: #555;
}
</style>
