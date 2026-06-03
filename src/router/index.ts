import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
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
