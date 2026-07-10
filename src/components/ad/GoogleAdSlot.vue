<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  clientId: string
  slotId: string
  format?: 'infoflow' | 'banner'
}>(), {
  format: 'infoflow',
})

const containerRef = ref<HTMLElement>()
const loaded = ref(false)
let observer: IntersectionObserver | null = null
let idleCallbackId: number | null = null

const isConfigured = computed(() => props.clientId && props.slotId)

function loadAd(): void {
  if (loaded.value || !containerRef.value) return

  const ins = document.createElement('ins')
  ins.className = 'adsbygoogle'
  ins.style.display = 'block'
  ins.style.textAlign = 'center'
  ins.setAttribute('data-ad-client', props.clientId)
  ins.setAttribute('data-ad-slot', props.slotId)
  ins.setAttribute('data-ad-format', props.format === 'infoflow' ? 'fluid' : 'auto')
  ins.setAttribute('data-ad-layout-key', props.format === 'infoflow' ? '-fb+5w+4e-db+86' : '')
  ins.setAttribute('data-full-width-responsive', 'true')

  containerRef.value.innerHTML = ''
  containerRef.value.appendChild(ins)

  idleCallbackId = requestIdleCallback(() => {
    try {
      ;(window as any).adsbygoogle?.push?.({})
    } catch {
      // AdSense 未加载时静默忽略
    }
  })
  loaded.value = true
}

onMounted(() => {
  if (!containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loaded.value) {
        loadAd()
        observer?.disconnect()
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (idleCallbackId !== null) cancelIdleCallback(idleCallbackId)
})
</script>

<template>
  <div
    v-if="isConfigured"
    ref="containerRef"
    class="ad-slot-container"
  />
  <div v-else />
</template>

<style scoped>
</style>
