<script setup lang="ts">
import { ref, watch } from 'vue'
import { components } from '@/editor-components'

interface TagInfo {
  tagName: string
  attrs: Record<string, string>
  selfClose: boolean
  from: number
  to: number
}

interface AttrMeta {
  key: string
  label: string
  default: string
  required?: boolean
  options?: string[]
  hint?: string
}

const props = defineProps<{
  visible: boolean
  tagInfo: TagInfo | null
}>()

const emit = defineEmits<{
  close: []
  update: [attrs: Record<string, string>]
}>()

// ── 动态 schema ──
function buildTagSchema(): Record<string, AttrMeta[]> {
  const tagAttrs = new Map<string, Map<string, AttrMeta>>()
  for (const comp of components) {
    if (!comp.attrs || comp.attrs.length === 0) {
      if (!tagAttrs.has(comp.tag)) tagAttrs.set(comp.tag, new Map())
      continue
    }
    let attrMap = tagAttrs.get(comp.tag)
    if (!attrMap) { attrMap = new Map(); tagAttrs.set(comp.tag, attrMap) }
    for (const attr of comp.attrs) {
      if (attrMap.has(attr.key)) {
        const ex = attrMap.get(attr.key)!
        if (attr.options && ex.options) {
          ex.options = [...new Set([...ex.options, ...attr.options])]
        }
      } else {
        attrMap.set(attr.key, {
          key: attr.key, label: attr.label,
          default: attr.default || '', required: attr.required,
          options: attr.options ? [...attr.options] : undefined,
        })
      }
    }
  }
  const schema: Record<string, AttrMeta[]> = {}
  for (const [tag, m] of tagAttrs) schema[tag] = [...m.values()]
  return schema
}
const TAG_SCHEMA = buildTagSchema()

const ATTR_HINTS: Record<string, Record<string, string>> = {
  slider: { images: '多张图片用逗号分隔', type: '1=循环 / 2=来回 / 3=滚回 / 4=淡入淡出', interval: '每张停留时间，最小 2 秒' },
  'p-title': { num: '如 01、02', size: '仅 level=1 时生效', hide: '留空=全部显示 / num=隐藏序号 / line=隐藏横线' },
  steps: { active: '当前高亮步骤，数字 1/2/3', direction: '仅 type=DA01 时生效' },
  compare: { direction: '仅 type=DA01 时生效' },
  engage: { label: 'DA01 样式使用', subtitle: 'DA02 样式使用', color: 'DA02 样式使用，多色用 | 分隔，请直接编辑器修改' },
}

// ── 状态 ──
const editedAttrs = ref<Record<string, string>>({})
const attrKeys = ref<string[]>([])

function buildSchemaMap(tagName: string): Map<string, AttrMeta> {
  const m = new Map<string, AttrMeta>()
  for (const a of TAG_SCHEMA[tagName] || []) m.set(a.key, a)
  return m
}

function buildFiltered(): Record<string, string> {
  const schemaMap = buildSchemaMap(props.tagInfo?.tagName || '')
  const filtered: Record<string, string> = {}
  for (const [k, v] of Object.entries(editedAttrs.value)) {
    const meta = schemaMap.get(k)
    const inOriginal = props.tagInfo && k in props.tagInfo.attrs
    const isDefault = v === (meta?.default || '')
    if (inOriginal || !isDefault || v !== '') filtered[k] = v
  }
  return filtered
}

watch(() => props.tagInfo, (info) => {
  if (!info) return
  const schema = TAG_SCHEMA[info.tagName]
  const merged: Record<string, string> = {}
  if (schema) {
    for (const a of schema) {
      const actual = info.attrs[a.key]
      merged[a.key] = actual !== undefined && actual !== '' ? actual : a.default
    }
  }
  for (const [k, v] of Object.entries(info.attrs)) {
    if (!(k in merged)) merged[k] = v
  }
  editedAttrs.value = merged
  attrKeys.value = Object.keys(merged)
}, { immediate: true })

// 实时回写（300ms 防抖）
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(editedAttrs, () => {
  if (!props.visible || !props.tagInfo) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update', buildFiltered())
  }, 300)
}, { deep: true })

function getMeta(key: string): AttrMeta {
  return TAG_SCHEMA[props.tagInfo?.tagName || '']?.find(a => a.key === key) || { key, label: key, default: '' }
}
function getHint(key: string): string | undefined {
  return ATTR_HINTS[props.tagInfo?.tagName || '']?.[key]
}
function isColorField(key: string): boolean {
  return /color/i.test(key) && !getMeta(key).options
}
function getColorHint(key: string): string | undefined {
  const specific = getHint(key)
  const generic = '使用颜色单词或十六进制颜色'
  return specific ? `${generic}；${specific}` : generic
}

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
}
</script>

<template>
  <div v-if="visible" class="w-[300px] min-w-[300px] flex flex-col border-l border-[var(--border-color,#e5e7eb)] bg-[var(--bg-primary,#fff)] overflow-hidden">
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-color,#e5e7eb)] shrink-0">
      <span class="font-mono text-xs font-semibold text-[var(--accent,#6c5ce7)]">&lt;{{ tagInfo?.tagName }}&gt;</span>
      <button class="flex items-center justify-center w-[22px] h-[22px] border-0 rounded bg-transparent text-[var(--text-muted,#9ca3af)] cursor-pointer hover:bg-[var(--bg-secondary,#f3f4f6)] hover:text-[var(--text-primary,#111)]" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div v-if="attrKeys.length === 0" class="p-5 text-center text-[var(--text-muted,#9ca3af)] text-xs">该标签没有可编辑的属性</div>

    <div v-else class="px-3 py-2.5 flex flex-col gap-2 overflow-y-auto flex-1">
      <div v-for="key in attrKeys" :key="key" class="flex flex-col gap-[3px]">
        <label class="text-[11px] font-semibold text-[var(--text-secondary,#6b7280)] flex items-center gap-1">
          {{ getMeta(key).label }}
          <code class="text-[10px] font-normal text-[var(--text-muted,#9ca3af)] bg-[var(--bg-secondary,#f3f4f6)] px-1 py-px rounded-sm">{{ key }}</code>
          <span v-if="getMeta(key).required" class="text-[11px] text-red-500">*</span>
        </label>
        <select v-if="getMeta(key).options" v-model="editedAttrs[key]" class="w-full py-[5px] px-2 text-xs border border-[var(--border-color,#d1d5db)] rounded-[5px] bg-[var(--bg-primary,#fff)] text-[var(--text-primary,#111)] outline-none box-border cursor-pointer appearance-none bg-no-repeat bg-[right_8px_center] pr-6 focus:border-[var(--accent,#6c5ce7)] focus:shadow-[0_0_0_2px_rgba(108,92,231,0.1)]" :style="selectChevronStyle">
          <option v-for="opt in getMeta(key).options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <input v-else v-model="editedAttrs[key]" class="w-full py-[5px] px-2 text-xs border border-[var(--border-color,#d1d5db)] rounded-[5px] bg-[var(--bg-primary,#fff)] text-[var(--text-primary,#111)] outline-none box-border focus:border-[var(--accent,#6c5ce7)] focus:shadow-[0_0_0_2px_rgba(108,92,231,0.1)]" type="text" />
        <span v-if="isColorField(key)" class="text-[10px] text-[var(--text-muted,#9ca3af)] leading-[1.3]">{{ getColorHint(key) }}</span>
        <span v-else-if="getHint(key)" class="text-[10px] text-[var(--text-muted,#9ca3af)] leading-[1.3]">{{ getHint(key) }}</span>
      </div>
    </div>

  </div>
</template>
