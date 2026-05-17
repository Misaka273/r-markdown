<script setup lang="ts">
import { ref, onMounted } from 'vue'

const visible = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})

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
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M16 32V20l6 6 6-6v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: '图片窗口化',
    desc: '长图限制高度可滚动，多图横向并排滑动，告别刷屏式图片堆叠。',
  },
  {
    icon: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" stroke-width="2.5"/><path d="M15 15h18v18H15z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 15V12h6v3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    title: '本地存储',
    desc: '所有内容自动保存在浏览器本地，无需登录注册，打开即用。',
  },
]
</script>

<template>
  <div class="landing" :class="{ visible }">
    <!-- Header -->
    <header class="landing-header">
      <div class="header-inner">
        <div class="logo">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <rect width="24" height="24" rx="5" fill="#576B95" />
            <text x="2.5" y="17.5" font-family="Arial" font-size="11" font-weight="bold" fill="white">RM</text>
          </svg>
          <span class="logo-text">R-Markdown</span>
        </div>
        <nav class="header-nav">
          <a href="#features" class="nav-link">功能</a>
          <a href="#editor" class="nav-link">编辑器</a>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Markdown → 公众号排版</div>
        <h1 class="hero-title">
          写 Markdown，<br>
          <span class="hero-highlight">发公众号</span>
        </h1>
        <p class="hero-subtitle">
          专为公众号创作者打造的 Markdown 排版工具。<br>
          左侧写 Markdown，右侧实时预览，一键复制到公众号编辑器。
        </p>
        <div class="hero-actions">
          <a href="/editor" class="btn btn-primary">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/>
              <polyline points="13 2 13 7 18 7"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <polyline points="7 14 10 11 13 14"/>
            </svg>
            打开编辑器
          </a>
          <a href="#features" class="btn btn-ghost">了解更多</a>
        </div>
        <p class="hero-hint">无需安装 · 免费使用 · 浏览器本地存储</p>
      </div>
    </section>

    <!-- Preview Mockup -->
    <section class="mockup-section">
      <div class="mockup-inner">
        <div class="mockup-window">
          <div class="mockup-titlebar">
            <div class="mockup-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="mockup-title">R-Markdown Editor</span>
          </div>
          <div class="mockup-body">
            <div class="mockup-editor-side">
              <div class="mockup-line"><span class="ml-kw">---</span></div>
              <div class="mockup-line"><span class="ml-key">title:</span> <span class="ml-str">我的公众号文章</span></div>
              <div class="mockup-line"><span class="ml-kw">---</span></div>
              <div class="mockup-line"></div>
              <div class="mockup-line"><span class="ml-h2">## 文章标题</span></div>
              <div class="mockup-line"></div>
              <div class="mockup-line"><span class="ml-text">这里是正文内容，</span><span class="ml-bold">**支持加粗**</span></div>
              <div class="mockup-line"><span class="ml-text">还有</span><span class="ml-gradient">==渐变文字==</span><span class="ml-text">效果</span></div>
              <div class="mockup-line"></div>
              <div class="mockup-line"><span class="ml-img">![图片描述](url)</span></div>
            </div>
            <div class="mockup-divider"></div>
            <div class="mockup-preview-side">
              <div class="mockup-phone-frame">
                <div class="mockup-phone-notch"></div>
                <div class="mockup-phone-content">
                  <div class="mockup-article-title">我的公众号文章</div>
                  <div class="mockup-article-body">
                    <div class="mockup-article-text">这里是正文内容，<strong>支持加粗</strong></div>
                    <div class="mockup-article-text">还有<span class="mockup-gradient-text">渐变文字</span>效果</div>
                    <div class="mockup-article-img"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="features-section">
      <div class="features-inner">
        <h2 class="section-title">为什么选择 R-Markdown</h2>
        <p class="section-subtitle">专为公众号创作者设计，让排版不再是负担</p>
        <div class="features-grid">
          <div v-for="(f, i) in features" :key="i" class="feature-card">
            <div class="feature-icon" v-html="f.icon"></div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2 class="cta-title">开始你的创作</h2>
        <p class="cta-subtitle">打开编辑器，写下第一篇公众号文章</p>
        <a href="/editor" class="btn btn-primary btn-lg">
          立即使用
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="10" x2="15" y2="10"/>
            <polyline points="11 6 15 10 11 14"/>
          </svg>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <span class="footer-text">© 2026 R-Markdown · 公众号 Markdown 排版工具</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Base ── */
.landing {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a2e;
  background: #fff;
  min-height: 100vh;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.landing.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Header ── */
.landing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
}
.header-nav {
  display: flex;
  gap: 28px;
}
.nav-link {
  font-size: 14px;
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #576B95;
}

/* ── Hero ── */
.hero {
  padding: 140px 32px 60px;
  text-align: center;
}
.hero-inner {
  max-width: 720px;
  margin: 0 auto;
}
.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(87, 107, 149, 0.08);
  color: #576B95;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 28px;
}
.hero-title {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 0 0 24px;
}
.hero-highlight {
  background: linear-gradient(135deg, #576B95, #7B68EE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: 18px;
  line-height: 1.7;
  color: #666;
  margin: 0 0 40px;
}
.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 20px;
}
.hero-hint {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: #576B95;
  color: #fff;
  box-shadow: 0 2px 12px rgba(87, 107, 149, 0.3);
}
.btn-primary:hover {
  background: #4a5d82;
  box-shadow: 0 4px 20px rgba(87, 107, 149, 0.4);
  transform: translateY(-1px);
}
.btn-ghost {
  background: transparent;
  color: #555;
  border: 1.5px solid #ddd;
}
.btn-ghost:hover {
  border-color: #576B95;
  color: #576B95;
}
.btn-lg {
  padding: 14px 36px;
  font-size: 16px;
  border-radius: 12px;
}

/* ── Mockup ── */
.mockup-section {
  padding: 20px 32px 80px;
}
.mockup-inner {
  max-width: 960px;
  margin: 0 auto;
}
.mockup-window {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
}
.mockup-titlebar {
  background: #f5f5f5;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e5e5e5;
}
.mockup-dots {
  display: flex;
  gap: 6px;
}
.mockup-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
}
.mockup-dots span:nth-child(1) { background: #ff5f57; }
.mockup-dots span:nth-child(2) { background: #febc2e; }
.mockup-dots span:nth-child(3) { background: #28c840; }
.mockup-title {
  font-size: 12px;
  color: #888;
}
.mockup-body {
  display: flex;
  background: #fafafa;
  min-height: 340px;
}
.mockup-editor-side {
  flex: 1;
  padding: 20px 24px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.8;
}
.mockup-divider {
  width: 1px;
  background: #e5e5e5;
}
.mockup-preview-side {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.mockup-line {
  height: 22px;
}
.ml-kw { color: #999; }
.ml-key { color: #576B95; }
.ml-str { color: #e06c75; }
.ml-h2 { color: #1a1a2e; font-weight: 700; font-size: 14px; }
.ml-text { color: #444; }
.ml-bold { color: #1a1a2e; font-weight: 700; }
.ml-gradient { color: #7B68EE; }
.ml-img { color: #576B95; opacity: 0.6; }

/* Phone mockup */
.mockup-phone-frame {
  width: 200px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #eee;
}
.mockup-phone-notch {
  height: 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}
.mockup-phone-content {
  padding: 16px;
}
.mockup-article-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a1a2e;
}
.mockup-article-body {
  font-size: 11px;
  line-height: 1.7;
  color: #555;
}
.mockup-article-text {
  margin-bottom: 6px;
}
.mockup-article-text strong {
  color: #1a1a2e;
}
.mockup-gradient-text {
  background: linear-gradient(135deg, #576B95, #7B68EE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}
.mockup-article-img {
  margin-top: 10px;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(135deg, #e8eaf6, #c5cae9);
}

/* ── Features ── */
.features-section {
  padding: 80px 32px;
  background: #f8f9fc;
}
.features-inner {
  max-width: 1000px;
  margin: 0 auto;
}
.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0 0 12px;
}
.section-subtitle {
  text-align: center;
  font-size: 16px;
  color: #888;
  margin: 0 0 48px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.feature-card {
  background: #fff;
  border-radius: 14px;
  padding: 28px 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.25s, transform 0.25s;
}
.feature-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
}
.feature-icon {
  width: 44px;
  height: 44px;
  color: #576B95;
  margin-bottom: 16px;
}
.feature-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.feature-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}
.feature-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #777;
  margin: 0;
}

/* ── CTA ── */
.cta-section {
  padding: 100px 32px;
  text-align: center;
}
.cta-inner {
  max-width: 600px;
  margin: 0 auto;
}
.cta-title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0 0 12px;
}
.cta-subtitle {
  font-size: 16px;
  color: #888;
  margin: 0 0 36px;
}

/* ── Footer ── */
.landing-footer {
  padding: 24px 32px;
  border-top: 1px solid #f0f0f0;
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}
.footer-text {
  font-size: 13px;
  color: #aaa;
}
</style>
