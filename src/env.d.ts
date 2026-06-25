/// <reference types="vite/client" />

declare const __PRIVATE_HOMEPAGE__: boolean

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
