<template>
  <footer class="site-footer px-4 sm:px-8 py-6 border-t border-black/[0.06]">
    <div class="mx-auto max-w-[1100px] text-center">
      <p class="text-[13px] text-[#bbb]">© 2026 R-Markdown · Markdown to WeChat</p>
      <p v-if="showExtra" class="text-[12px] text-[#ccc] mt-1">网站使用AI辅助生成</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineProps<{ showExtra?: boolean }>()
</script>

<style scoped>
[data-theme='dark'] .site-footer {
  border-color: rgba(255, 255, 255, 0.08);
}
[data-theme='dark'] .site-footer p {
  color: #666;
}
</style>
