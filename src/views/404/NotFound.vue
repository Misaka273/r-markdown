<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found-card">
      <p class="not-found-code">404</p>
      <h1 class="not-found-title">页面未找到</h1>
      <p class="not-found-desc">您访问的页面不存在或已被移除</p>
      <button class="not-found-btn" @click="router.replace('/')">
        <Home class="not-found-btn-icon" :size="16" />
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.not-found-card {
  text-align: center;
}

.not-found-code {
  font-size: 6rem;
  font-weight: 800;
  color: #d1d5db;
  line-height: 1;
  margin: 0 0 0.5rem;
}

.not-found-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem;
}

.not-found-desc {
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0 0 1.5rem;
}

.not-found-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background: #27ae60;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}

.not-found-btn:hover {
  background: #219a52;
}

.not-found-btn-icon {
  flex-shrink: 0;
}
</style>
