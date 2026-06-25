import { createRouter, createWebHashHistory } from 'vue-router'

const isTauriClient = import.meta.env.VITE_TAURI === 'true'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // Tauri 客户端默认打开编辑器，Web 版显示首页
      component: isTauriClient
        ? () => import('../views/editor/EditorPage.vue')
        : __PRIVATE_HOMEPAGE__
          ? () => import('../views-private/home/HomePage.vue')
          : () => import('../views/home/HomePage.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/editor/EditorPage.vue'),
    },
    {
      path: '/components',
      name: 'components',
      component: () => import('@/views/extension/ExtensionPage.vue'),
    },
    {
      path: '/pixi',
      name: 'pixi',
      component: __PRIVATE_HOMEPAGE__
        ? () => import('../views-private/home/HomePage.vue')
        : () => import('../views/home/HomePage.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
