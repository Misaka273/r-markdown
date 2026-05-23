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

// 组件示例数据
const componentExamples = ref<Array<{
  id: string
  name: string
  description: string
  example: string
  rendered: string
}>>([])

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
  
  // 生成组件示例
  componentExamples.value = components.map(comp => ({
    id: comp.id,
    name: comp.name,
    description: comp.description || '',
    example: comp.example || '',
    rendered: comp.example ? parseMarkdown(comp.example, demoColors) : ''
  }))
})
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
        <!-- Page Title -->
        <div class="mb-8 sm:mb-12">
          <h1 class="text-[28px] sm:text-[40px] font-extrabold tracking-tight text-[#111] m-0 mb-2">
            组件预览
          </h1>
          <p class="text-base sm:text-[19px] text-[#888] m-0">
            悬停卡片查看组件语法
          </p>
        </div>

        <!-- Components Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div
            v-for="comp in componentExamples"
            :key="comp.id"
            class="flip-card"
          >
            <div class="flip-card-inner">
              <!-- Front: Preview -->
              <div class="flip-card-front bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div class="preview-area p-6 min-h-[180px] flex flex-col">
                  <div class="flex items-center gap-2 mb-4">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#6c5ce7]/10 text-[#6c5ce7] text-[12px] font-bold">
                      {{ comp.id.split('_')[1] || comp.id.slice(-2) }}
                    </span>
                    <span class="text-[14px] font-semibold text-[#111]">{{ comp.name }}</span>
                  </div>
                  <div v-if="comp.rendered" v-html="comp.rendered" class="preview-content flex-1"></div>
                  <div v-else class="text-[13px] text-[#ccc] italic flex-1 flex items-center justify-center">暂无示例</div>
                </div>
              </div>

              <!-- Back: Syntax -->
              <div class="flip-card-back bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div class="p-6 h-full flex flex-col">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#6c5ce7]/10 text-[#6c5ce7] text-[12px] font-bold">
                      {{ comp.id.split('_')[1] || comp.id.slice(-2) }}
                    </span>
                    <span class="text-[14px] font-semibold text-[#111]">{{ comp.name }}</span>
                  </div>
                  
                  <p v-if="comp.description" class="text-[12px] text-[#666] m-0 mb-3 leading-relaxed">
                    {{ comp.description }}
                  </p>
                  
                  <div class="flex-1 flex flex-col">
                    <div class="text-[11px] text-[#999] font-medium mb-2 uppercase tracking-wider">语法示例</div>
                    <pre class="bg-[#f5f5f7] rounded-lg p-4 text-[12px] text-[#444] overflow-x-auto m-0 font-mono leading-relaxed flex-1"><code>{{ comp.example }}</code></pre>
                  </div>
                </div>
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

/* 卡片翻转 */
.flip-card {
  perspective: 1200px;
  height: 240px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
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
[data-theme='dark'] .flip-card-front,
[data-theme='dark'] .flip-card-back {
  background: #1a1a1e;
  border-color: rgba(255, 255, 255, 0.08);
}
[data-theme='dark'] .flip-card-front .preview-area,
[data-theme='dark'] .flip-card-back {
  background: #1a1a1e;
}
[data-theme='dark'] .flip-card-back pre {
  background: #222226;
  color: #ccc;
}
[data-theme='dark'] footer {
  border-color: rgba(255, 255, 255, 0.06);
}
[data-theme='dark'] footer p {
  color: #555;
}
</style>
