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
        ? () => import('../views/EditorPage.vue')
        : () => import('../views/HomePage.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/EditorPage.vue'),
    },
    {
      path: '/components',
      name: 'components',
      component: () => import('../views/ComponentShowcase.vue'),
    },
  ],
})

export default router
