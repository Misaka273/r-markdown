/// <reference types="vite/client" />

declare const __IS_CLOUDFLARE__: boolean
declare const __IS_GITHUB_DEPLOY__: boolean

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
