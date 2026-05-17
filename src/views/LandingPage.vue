<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { parseMarkdown } from '@/utils/markdownParser'
import type { ThemeColors } from '@/composables/useTheme'

const visible = ref(false)
const featuresVisible = ref(false)

// ── 打字动画 ──
const demoMd = `---
title: 三十几岁以后，我学会了一件事
badge: 成长感悟
subtitle: 不是所有关系都值得维护
chips: 成熟|减法|社交
---

我慢慢学会了一件事：
**不是所有关系** 都值得你拼命维护。
那些让你觉得 ::累:: 的社交，其实早该放下了。
==真正的成熟，是懂得给自己做减法。==`

const typedMd = ref('')
const typingDone = ref(false)
const previewRef = ref<HTMLElement>()
let typingTimer: ReturnType<typeof setTimeout> | null = null
let charIndex = 0

const demoColors: ThemeColors = {
  accent: '#6c5ce7',
  dark: '#5a4bd1',
  light: '#f0edff',
  border: '#e5e7eb',
  rgb: '108,92,231',
}

function typeNextChar() {
  if (charIndex < demoMd.length) {
    typedMd.value += demoMd[charIndex]
    charIndex++
    // 换行稍慢，模拟真实输入节奏
    const delay = demoMd[charIndex - 1] === '\n' ? 80 : 30
    typingTimer = setTimeout(typeNextChar, delay)
  } else {
    typingDone.value = true
    // 打完后停顿，然后重新开始
    typingTimer = setTimeout(() => {
      typedMd.value = ''
      charIndex = 0
      typingDone.value = false
      typingTimer = setTimeout(typeNextChar, 800)
    }, 3000)
  }
}

function updatePreview() {
  if (previewRef.value) {
    previewRef.value.innerHTML = parseMarkdown(typedMd.value, demoColors)
  }
}

// 监听 typedMd 变化，实时更新右侧预览
watch(typedMd, () => {
  updatePreview()
})

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          featuresVisible.value = true
          observer.disconnect()
        }
      })
    },
    { threshold: 0.1 }
  )

  setTimeout(() => {
    const el = document.getElementById('features')
    if (el) observer.observe(el)
  }, 100)

  // 预览区域可见时启动打字动画
  const previewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && charIndex === 0) {
          typingTimer = setTimeout(typeNextChar, 600)
          previewObserver.disconnect()
        }
      })
    },
    { threshold: 0.2 }
  )
  setTimeout(() => {
    const el = document.getElementById('demo-preview')
    if (el) previewObserver.observe(el)
  }, 100)
})

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
})

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

// ── 导航栏滑动高亮 ──
const navRef = ref<HTMLElement | null>(null)
const highlightStyle = ref<{ left: string; width: string; opacity: string }>({ left: '0px', width: '0px', opacity: '0' })

// ── Logo 打字机效果 ──
const logoTextRef = ref<HTMLElement | null>(null)
const logoFullText = 'R-Markdown'
let logoTypingTimer: ReturnType<typeof setTimeout> | null = null

function onLogoEnter() {
  const el = logoTextRef.value
  if (!el) return
  if (logoTypingTimer) clearTimeout(logoTypingTimer)
  el.textContent = ''
  el.classList.add('typing-cursor')
  let i = 0
  function typeNext() {
    if (i < logoFullText.length) {
      el.textContent += logoFullText[i]
      i++
      logoTypingTimer = setTimeout(typeNext, 60)
    } else {
      logoTypingTimer = setTimeout(() => el.classList.remove('typing-cursor'), 400)
    }
  }
  typeNext()
}

function onLogoLeave() {
  const el = logoTextRef.value
  if (!el) return
  if (logoTypingTimer) clearTimeout(logoTypingTimer)
  el.classList.remove('typing-cursor')
  el.textContent = logoFullText
}

function onNavEnter(e: MouseEvent, _key: string) {
  const el = e.currentTarget as HTMLElement
  const nav = navRef.value
  if (!nav || !el) return
  const navRect = nav.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
      highlightStyle.value = {
    left: (elRect.left - navRect.left) + 'px',
    width: elRect.width + 'px',
    opacity: '1',
  }
}

function onNavLeave() {
  highlightStyle.value = { ...highlightStyle.value, opacity: '0' }
}

// ── 左侧语法高亮 ──
function renderMdLine(line: string): Array<{ type: string; text: string }> {
  const segments: Array<{ type: string; text: string }> = []
  // frontmatter key: value
  const fmMatch = line.match(/^(\w+):\s*(.*)/)
  if (fmMatch && !line.startsWith('---')) {
    segments.push({ type: 'key', text: fmMatch[1] + ': ' })
    segments.push({ type: 'normal', text: fmMatch[2] })
    return segments
  }
  if (line.trim() === '---') {
    segments.push({ type: 'accent', text: line })
    return segments
  }
  // bold **text**
  let remaining = line
  const boldRe = /\*\*(.+?)\*\*/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  while ((m = boldRe.exec(remaining)) !== null) {
    if (m.index > lastIdx) segments.push({ type: 'normal', text: remaining.slice(lastIdx, m.index) })
    segments.push({ type: 'bold', text: m[1] })
    lastIdx = m.index + m[0].length
  }
  if (segments.length > 0) {
    if (lastIdx < remaining.length) segments.push({ type: 'normal', text: remaining.slice(lastIdx) })
    return segments
  }
  // ::accent:: and ==gradient==
  if (line.includes('::') || line.includes('==')) {
    const parts = line.split(/(::.*?::|==.*?==)/g)
    for (const p of parts) {
      if (p.startsWith('::') && p.endsWith('::')) {
        segments.push({ type: 'accentText', text: p })
      } else if (p.startsWith('==') && p.endsWith('==')) {
        segments.push({ type: 'gradient', text: p })
      } else {
        segments.push({ type: 'normal', text: p })
      }
    }
    return segments
  }
  segments.push({ type: 'normal', text: line })
  return segments
}

const features = [
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M14 18h20M14 24h14M14 30h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    title: 'Markdown 实时编辑',
    desc: '左侧编写 Markdown，右侧即时预览公众号排版效果，所见即所得。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M16 24l4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: '一键复制到公众号',
    desc: '富文本一键复制，直接粘贴到公众号编辑器，排版零损耗。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2.5"/><path d="M24 16v-4M24 36v-4M16 24h-4M36 24h-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    title: '多主题切换',
    desc: '内置多套配色主题，支持自定义强调色，打造专属公众号风格。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M18 14v20M30 14v20M14 22h20M14 30h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    title: '扩展排版组件',
    desc: '渐变文字、柔光重点、步骤流、对比卡片等丰富组件，让文章更出彩。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M16 32V20l6 6 6-6v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 32h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    title: '保存为图片',
    desc: '一键将排版好的文章导出为高清长图，方便分享到朋友圈或其他平台。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M15 15h18v18H15z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 15V12h6v3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: '本地存储',
    desc: '所有内容自动保存在浏览器本地，无需登录注册，打开即用。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M16 32V20l6 6 6-6v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 32h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
            title: '复制 HTML',
    desc: '一键复制排版后的 HTML 源码，方便嵌入网页、博客或其他平台使用。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M18 16l-6 8 6 8M30 16l6 8-6 8M26 13l-4 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: '语法示例',
    desc: '语法简单易上手，编辑器内置示例一键加载，边写边学零门槛。',
  },
]
</script>

<template>
    <div class="landing min-w-[960px]" :class="{ 'opacity-100 translate-y-0': visible, 'opacity-0 translate-y-3': !visible }">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-[rgba(245,245,247,0.8)] backdrop-blur-xl">
            <div class="mx-auto max-w-[1100px] flex items-center px-8 py-3.5">
                                        <router-link to="/" class="flex items-center gap-2.5 no-underline shrink-0 logo-link" @mouseenter="onLogoEnter" @mouseleave="onLogoLeave">
          <svg class="logo-icon" viewBox="0 0 24 24" width="26" height="26">
            <rect width="24" height="24" rx="6" fill="#6c5ce7" />
            <text x="3" y="17" font-family="Arial" font-size="10.5" font-weight="bold" fill="white">RM</text>
          </svg>
          <span ref="logoTextRef" class="text-[17px] font-bold text-[#111] tracking-tight logo-text">R-Markdown</span>
        </router-link>
                                                                                                                                                                                                                                                                                                                                                                                                                                <nav ref="navRef" class="nav-pill relative flex items-center rounded-full bg-black/5 px-0.5 py-0.5 ml-auto" @mouseleave="onNavLeave">
                                                                                                                                            <div class="nav-highlight absolute top-0.5 bottom-0.5 rounded-full bg-black/8 transition-all duration-300 ease-out" :style="highlightStyle"></div>
          <a href="javascript:void(0)" class="nav-link relative z-10 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[14px] font-medium text-[#555] no-underline transition-colors hover:text-[#111]" @mouseenter="onNavEnter($event, 'features')" @click="scrollToFeatures">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></svg>
            功能
          </a>
                              <span class="w-1 h-1 rounded-full bg-black/20 relative z-10 mx-1"></span>
          <a href="https://github.com/RobocopMao/r-markdown" target="_blank" rel="noopener noreferrer" class="nav-link relative z-10 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[14px] font-medium text-[#555] no-underline transition-colors hover:text-[#111]" @mouseenter="onNavEnter($event, 'github')">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.167 20 14.418 20 10c0-5.523-4.477-10-10-10z"/></svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="px-8 pt-[100px] pb-20">
      <div class="mx-auto max-w-[1100px]">
        <h1 class="text-[clamp(56px,8vw,92px)] font-black leading-[1.1] tracking-[-2px] text-[#111] m-0 mb-8">
          写 Markdown，<br>
          发<span class="text-[#6c5ce7]">公众号</span>。
        </h1>
        <p class="text-2xl font-semibold text-black/80 m-0 mb-5 tracking-tight">
          R-Markdown — 最简洁的公众号 Markdown 排版工具
        </p>
        <p class="text-[19px] leading-relaxed text-black/[0.55] m-0">
          左侧写 Markdown，右侧实时预览排版效果，<br>
          一键复制粘贴到公众号编辑器，告别繁琐排版。<br>
          <span class="text-[#6c5ce7]">为你，也为每一个认真写内容的人。</span>
        </p>
                <router-link to="/editor" class="cta-btn inline-flex items-center gap-2 mt-10 px-10 py-4 bg-[#6c5ce7] text-white text-lg font-semibold rounded-xl no-underline transition-all hover:bg-[#5a4bd1] hover:-translate-y-px active:scale-[0.97]">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M12 5l5 5-5 5"/></svg>
          打开编辑器
        </router-link>
        <p class="mt-4 ml-4 text-[15px] text-black/[0.55]">开源免费，点击即用</p>
      </div>
    </section>

                <!-- Preview -->
    <section id="demo-preview" class="px-8 pb-20">
      <div class="mx-auto max-w-[1100px]">
        <div class="rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
          <!-- Title bar -->
          <div class="flex items-center gap-2 px-5 py-3 bg-[#f5f5f7] border-b border-black/[0.06]">
            <span class="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
            <span class="w-3 h-3 rounded-full bg-[#febc2e]"></span>
            <span class="w-3 h-3 rounded-full bg-[#28c840]"></span>
            <span class="ml-3 text-[13px] text-[#999] font-medium">R-Markdown Editor</span>
          </div>
          <!-- Editor body -->
          <div class="flex min-h-[480px]">
            <!-- Left: Markdown source (typing animation) -->
            <div class="flex-[5] border-r border-black/[0.06] bg-[#fafafa] p-8 font-mono text-[15px] leading-[1.9] text-[#444] overflow-hidden">
              <div class="text-[#999] text-[12px] mb-3 select-none">Markdown</div>
              <pre class="whitespace-pre-wrap break-words m-0 font-inherit text-inherit"><span v-for="(line, i) in typedMd.split('\n')" :key="i"><template v-for="(segment, j) in renderMdLine(line)" :key="j"><span v-if="segment.type === 'key'" class="text-[#6c5ce7]">{{ segment.text }}</span><span v-else-if="segment.type === 'bold'" class="font-bold text-[#111]">{{ segment.text }}</span><span v-else-if="segment.type === 'accent'" class="text-[#6c5ce7]">{{ segment.text }}</span><span v-else-if="segment.type === 'accentText'" class="text-[#6c5ce7]">{{ segment.text }}</span><span v-else-if="segment.type === 'gradient'" class="text-[#333]">{{ segment.text }}</span><span v-else class="text-[#666]">{{ segment.text }}</span></template><span v-if="!typingDone && i === typedMd.split('\n').length - 1" class="inline-block w-[2px] h-[1.1em] bg-[#6c5ce7] align-middle ml-[1px] animate-blink"></span>
</span></pre>
            </div>
            <!-- Right: Live preview -->
            <div class="flex-[3] bg-white p-8">
              <div class="text-[#999] text-[12px] mb-4 select-none">预览</div>
              <div ref="previewRef" class="preview-content"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="px-8 py-20 transition-all duration-800" :class="featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'">
      <div class="mx-auto max-w-[1100px]">
        <h2 class="text-[40px] font-extrabold tracking-tight text-[#111] m-0 mb-2">功能</h2>
        <p class="text-[19px] text-[#888] m-0 mb-12">一切为了更专注的写作体验</p>
                        <div class="grid grid-cols-3 gap-5">
          <div
            v-for="(f, i) in features"
            :key="i"
            class="bg-white rounded-2xl px-8 pt-9 pb-8 border border-black/[0.04] opacity-0 translate-y-7 transition-all duration-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            :class="featuresVisible ? '!opacity-100 !translate-y-0' : ''"
            :style="{ transitionDelay: `${i * 0.1}s` }"
          >
            <div class="w-10 h-10 text-[#6c5ce7] mb-4.5 [&_svg]:w-full [&_svg]:h-full" v-html="f.icon"></div>
            <h3 class="text-lg font-bold text-[#111] m-0 mb-2">{{ f.title }}</h3>
            <p class="text-base leading-[1.65] text-[#888] m-0">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-8 pt-20 pb-[100px] text-center">
      <div class="mx-auto max-w-[600px]">
        <h2 class="text-[36px] font-extrabold tracking-tight text-[#111] m-0 mb-2">开始写作</h2>
        <p class="text-[17px] text-[#888] m-0 mb-8">无需注册，打开即用</p>
                <router-link to="/editor" class="cta-btn inline-flex items-center gap-2 bg-[#6c5ce7] text-white no-underline px-9 py-3.5 rounded-xl text-base font-semibold transition-all hover:bg-[#5a4bd1] hover:-translate-y-px">
          打开编辑器
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M12 5l5 5-5 5"/></svg>
        </router-link>
      </div>
        </section>

    <!-- 公众号反馈 -->
    <section class="px-8 pb-20">
      <div class="mx-auto max-w-[600px] bg-white rounded-2xl border border-black/[0.06] px-10 py-10 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <p class="text-[17px] text-[#555] m-0 mb-6">使用中遇到问题或有建议？欢迎关注公众号反馈</p>
        <img src="/wechat-qr.png" alt="微信公众号二维码" class="w-[280px] rounded-xl" />
        <p class="text-[13px] text-[#999] mt-4 m-0">微信搜索「<span class="text-[#6c5ce7] font-medium">五味杂陈杂货铺</span>」</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-8 py-6 border-t border-black/[0.06]">
      <div class="mx-auto max-w-[1100px] text-center">
                <p class="text-[13px] text-[#bbb]">© 2026 R-Markdown · Markdown to WeChat</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: #f5f5f7;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.cta-btn {
  box-shadow: 0 0 20px 2px rgba(108, 92, 231, 0.15);
  transition: all 0.3s ease;
}
.cta-btn:hover {
  box-shadow: 0 0 30px 6px rgba(108, 92, 231, 0.3);
}

.nav-pill {
  overflow: hidden;
}

/* Logo 打字机效果 */
.logo-link {
  cursor: pointer;
}
.logo-text {
  display: inline-block;
  min-width: 0;
}
.typing-cursor::after {
  content: '|';
  display: inline-block;
  margin-left: 1px;
  font-weight: 400;
  color: #6c5ce7;
  animation: blink-cursor 0.6s step-end infinite;
}
@keyframes blink-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-end infinite;
}

.preview-content :deep(section) {
  transition: opacity 0.15s ease;
}
</style>
