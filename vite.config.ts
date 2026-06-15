import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

declare const process: { env: Record<string, string | undefined> }

const isTauri = process.env.VITE_TAURI === 'true'
const isWebDeploy = process.env.GITHUB_ACTIONS && !isTauri

export default defineConfig({
  base: isWebDeploy ? '/r-markdown/' : isTauri ? './' : '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
    // .ts 优先于 .js，避免旧的 .js 残留文件被优先加载
    extensions: ['.ts', '.mts', '.js', '.mjs', '.jsx', '.tsx', '.json'],
    // 强制 @tauri-apps/api 只加载一份，防止 HMR 产生双实例
    dedupe: ['@tauri-apps/api'],
  },
})
