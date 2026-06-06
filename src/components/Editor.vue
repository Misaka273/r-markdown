<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { EditorView, keymap, placeholder as ph } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  foldGutter,
} from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion, closeBrackets } from '@codemirror/autocomplete'
import { rectangularSelection } from '@codemirror/view'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scroll: [ratio: number]
  'tag-selected': [
    info: {
      tagName: string
      attrs: Record<string, string>
      selfClose: boolean
      from: number
      to: number
    } | null,
  ]
}>()

const editorRef = ref<HTMLDivElement>()
const { colors } = useTheme()
let view: EditorView | null = null

// ── 标签选中检测 ──
const tagRegex = /^<(\w[\w-]*)((?:\s+[^>]*?)?)(\/?)>/s
let lastTagSelection: { tagName: string; attrs: Record<string, string>; selfClose: boolean; from: number; to: number } | null = null

function checkTagSelection(state: EditorState) {
  const sel = state.selection.main
  if (sel.empty) {
    if (lastTagSelection) {
      lastTagSelection = null
      emit('tag-selected', null)
    }
    return
  }
  const text = state.sliceDoc(sel.from, sel.to)
  const match = text.match(tagRegex)
  if (!match) {
    if (lastTagSelection) {
      lastTagSelection = null
      emit('tag-selected', null)
    }
    return
  }
  const [, tagName, attrStr, selfClose] = match
  const attrs: Record<string, string> = {}
  if (attrStr) {
    const attrRegex = /(\w[\w-]*)="([^"]*)"/g
    let am
    while ((am = attrRegex.exec(attrStr)) !== null) {
      attrs[am[1]] = am[2]
    }
  }
  const newTag = { tagName, attrs, selfClose: selfClose === '/', from: sel.from, to: sel.from + match[0].length }
  if (
    !lastTagSelection ||
    lastTagSelection.tagName !== newTag.tagName ||
    lastTagSelection.from !== newTag.from ||
    lastTagSelection.to !== newTag.to
  ) {
    lastTagSelection = newTag
    emit('tag-selected', newTag)
  }
}

// 自定义语法高亮 — 去掉 defaultHighlightStyle 的 heading 下划线
const warmHighlight = HighlightStyle.define([
  { tag: tags.heading, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading1, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading2, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading3, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading4, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading5, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.heading6, textDecoration: 'none', fontWeight: '700', color: '#E06C75' },
  { tag: tags.strong, fontWeight: '700', color: '#C678DD' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#C678DD' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#56B6C2' },
  { tag: tags.link, color: '#61AFEF' },
  { tag: tags.url, color: '#61AFEF' },
  { tag: tags.meta, color: '#5C6370' },
  { tag: tags.comment, color: '#5C6370' },
  { tag: tags.string, color: '#98C379' },
  { tag: tags.number, color: '#D19A66' },
  { tag: tags.monospace, color: '#E06C75' },
  { tag: tags.quote, color: '#5C6370', fontStyle: 'italic' },
  { tag: tags.processingInstruction, color: '#ABB2BF' },
  { tag: tags.keyword, color: '#C678DD' },
  { tag: tags.atom, color: '#D19A66' },
  { tag: tags.operator, color: '#56B6C2' },
  { tag: tags.special(tags.string), color: '#98C379' },
])

// 自定义暖色调主题 — 匹配 Notion 风格
const warmTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--bg-editor)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      fontFamily:
        'ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      lineHeight: '1.6',
      height: '100%',
    },
    '.cm-content': {
      padding: '16px',
      caretColor: 'var(--accent)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-muted)',
      borderRight: '1px solid var(--border-color)',
      minWidth: '40px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bg-secondary)',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(var(--accent-rgb), 0.15) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(var(--accent-rgb), 0.2) !important',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--accent)',
      borderLeftWidth: '2px',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(var(--accent-rgb), 0.15)',
      outline: '1px solid rgba(var(--accent-rgb), 0.3)',
    },
    '.cm-foldGutter': {
      color: 'var(--text-muted)',
    },
    // 语法高亮色 — 暖色调
    '.cm-formatting': { color: '#b0a4c8' },
    '.cm-keyword': { color: '#c084fc' },
    '.cm-heading': { color: '#e879f9', fontWeight: '700', textDecoration: 'none' },
    '.cm-strong': { color: '#f0abfc', fontWeight: '700' },
    '.cm-emphasis': { color: '#f0abfc', fontStyle: 'italic' },
    '.cm-strikethrough': { color: '#9ca3af', textDecoration: 'line-through' },
    '.cm-link': { color: '#67e8f9' },
    '.cm-url': { color: '#67e8f9' },
    '.cm-meta': { color: '#9ca3af' },
    '.cm-comment': { color: '#9ca3af' },
    '.cm-string': { color: '#86efac' },
    '.cm-number': { color: '#fbbf24' },
    '.cm-monospace': {
      backgroundColor: 'rgba(var(--accent-rgb), 0.08)',
      color: '#f472b6',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '13px',
    },
    '.cm-blockquote': {
      color: '#9ca3af',
      fontStyle: 'italic',
    },
    '.cm-horizontalRule': {
      color: '#d1d5db',
    },
    '.cm-list': {
      color: '#c084fc',
    },
    // 滚动条隐藏
    '.cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'none',
    },
    '.cm-scroller::-webkit-scrollbar': {
      display: 'none',
    },
  },
  { dark: false },
)

onMounted(async () => {
  await nextTick()
  if (!editorRef.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
    if (update.selectionSet || update.docChanged) {
      checkTagSelection(update.state)
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      foldGutter(),

      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      highlightSelectionMatches(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      markdown({ codeLanguages: languages }),
      syntaxHighlighting(warmHighlight),
      warmTheme,
      ph('在此输入 Markdown...'),
      updateListener,
      EditorView.lineWrapping,
    ],
  })

  view = new EditorView({
    state,
    parent: editorRef.value,
  })

  // 滚动同步
  view.scrollDOM.addEventListener('scroll', () => {
    const el = view!.scrollDOM
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0) {
      emit('scroll', el.scrollTop / maxScroll)
    }
  })
})

// 监听外部内容变化（如撤销/重做或程序化更新）
let ignoreUpdate = false
watch(
  () => props.modelValue,
  (newVal) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (newVal === current) return
    ignoreUpdate = true
    view.dispatch({
      changes: { from: 0, to: current.length, insert: newVal },
    })
    ignoreUpdate = false
  },
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

// 暴露 scrollTo 方法给父组件
function scrollTo(ratio: number) {
  if (!view) return
  const el = view.scrollDOM
  const maxScroll = el.scrollHeight - el.clientHeight
  el.scrollTop = ratio * maxScroll
}

function replaceRange(from: number, to: number, text: string) {
  if (!view) return
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from, head: from + text.length },
  })
}

defineExpose({ scrollTo, replaceRange })
</script>

<template>
  <div class="editor-wrap flex h-full overflow-hidden" style="background: var(--bg-editor)">
    <div ref="editorRef" class="editor-container flex-1 h-full overflow-hidden"></div>
  </div>
</template>

<style scoped>
.editor-container {
  width: 100%;
}

.editor-container :deep(.cm-editor) {
  height: 100%;
}

.editor-container :deep(.cm-scroller) {
  overflow: auto;
  scrollbar-width: none;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar) {
  display: none;
}
</style>
