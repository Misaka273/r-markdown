import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingPage.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../views/EditorPage.vue'),
    },
  ],
})

export default router
