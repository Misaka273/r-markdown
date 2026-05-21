<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useDropdownGroup } from '../composables/useDropdownGroup'

const props = defineProps<{
  themes: { accent: string; dark: string }[]
  currentAccent: string
  customColor: string
}>()

const emit = defineEmits<{
  select: [accent: string, dark: string]
  customSelect: [hex: string]
}>()

const { toggle: groupToggle, isVisible } = useDropdownGroup('theme')
const pickerRef = ref<HTMLElement | null>(null)

function toggle() {
  groupToggle(!isVisible.value)
}

function onClickOutside(e: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
    groupToggle(false)
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})

function select(a: string, d: string) {
  emit('select', a, d)
  groupToggle(false)
}

function onCustomInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('customSelect', val)
}
</script>

<template>
  <div ref="pickerRef" class="relative">
    <button
      class="theme-btn w-7 h-7 rounded-full cursor-pointer flex items-center justify-center p-0 shrink-0 transition-all duration-200 hover:scale-110"
      :style="{ background: currentAccent }"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2" />
        <circle cx="12" cy="12" r="4" fill="white" stroke="none" />
      </svg>
    </button>
    <div
      class="theme-picker absolute top-full right-0 mt-2 p-3 rounded-xl z-10 w-50"
            :class="{ show: isVisible }"
    >
      <div class="flex flex-wrap gap-2">
        <div
          v-for="t in themes"
          :key="t.accent"
          class="theme-option w-7 h-7 rounded-full cursor-pointer border-2 border-transparent transition-all duration-200 hover:scale-115"
          :class="{ active: t.accent === currentAccent }"
          :style="{ '--c': t.accent, background: t.accent }"
          @click="select(t.accent, t.dark)"
        ></div>
      </div>
      <div class="custom-color-row mt-2.5 pt-2.5 border-t border-[var(--accent-border)]">
        <div class="flex items-center gap-2">
          <div
            class="custom-swatch w-7 h-7 rounded-full shrink-0 border-2 border-transparent transition-all duration-200 cursor-pointer hover:scale-115"
            :class="{
              active: !themes.some((t) => t.accent.toLowerCase() === currentAccent.toLowerCase()),
            }"
            :style="{ '--c': customColor, background: customColor }"
            @click="emit('customSelect', customColor)"
          ></div>
          <label
            class="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[12px] font-medium transition-all duration-150 hover:bg-[var(--accent-light)]"
            :style="{ color: 'var(--accent)' }"
          >
            <svg
              class="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
              />
            </svg>
            自定义颜色
            <input type="color" :value="customColor" class="sr-only" @input="onCustomInput" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-btn {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.theme-picker {
  display: none;
  background: var(--bg-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.theme-picker.show {
  display: block;
}

.theme-option.active {
  border-color: var(--c);
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 3.5px var(--c);
}

.custom-color-row .active {
  border-color: var(--c);
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 3.5px var(--c);
}
</style>
