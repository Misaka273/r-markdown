<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  clientId: string
  slotId: string
  format?: 'infoflow' | 'banner'
}>(), {
  format: 'infoflow',
})

const isConfigured = computed(() => props.clientId && props.slotId)

const containerRef = ref<HTMLElement>()
const loaded = ref(false)
let observer: IntersectionObserver | null = null

const ADSCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${props.clientId}`

function ensureAdScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${ADSCRIPT_URL}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = ADSCRIPT_URL
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
}

async function loadAd(): Promise<void> {
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

  // 标准 AdSense 模式：脚本加载前 push 到队列，脚本加载后自动处理
  ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
  loaded.value = true

  await ensureAdScript()
}

onMounted(() => {
  if (!isConfigured.value || !containerRef.value) return

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
