import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readdirSync } from 'fs'

declare const process: { env: Record<string, string | undefined> }

const isTauri = process.env.VITE_TAURI === 'true'
const isWebDeploy = process.env.GITHUB_ACTIONS && !isTauri

// 闭源 extension 子模块：目录为空（拉取失败）时 fallback 到本地空 stub，避免编译报错
const extensionDir = `${__dirname}/src/extension`
const hasExtension = existsSync(extensionDir) && readdirSync(extensionDir).filter(f => !f.startsWith('.')).length > 0

// 私有 views 子模块：拉取失败时 fallback 到公开版首页
const privateHomeFile = `${__dirname}/src/views-private/home/HomePagePixi.vue`
const hasPrivateHome = existsSync(privateHomeFile)

export default defineConfig({
  define: {
    __PRIVATE_HOMEPAGE__: JSON.stringify(hasPrivateHome),
  },
  base: isWebDeploy ? '/r-markdown/' : isTauri ? './' : '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: [
      ...(!hasExtension ? [{ find: '@/extension', replacement: '/src/extension-stubs' }] : []),
      { find: '@', replacement: '/src' },
    ],
    // .ts 优先于 .js，避免旧的 .js 残留文件被优先加载
    extensions: ['.ts', '.mts', '.js', '.mjs', '.jsx', '.tsx', '.json'],
    // 强制 @tauri-apps/api 只加载一份，防止 HMR 产生双实例
    dedupe: ['@tauri-apps/api'],
  },
})
