import { ref, watch } from 'vue'
import { getSetting, setSetting } from '@/config/settings'

export const paraFontSize = ref(getSetting<number>('paraFontSize'))
export const paraLineHeight = ref(getSetting<number>('paraLineHeight'))
export const paraFontWeight = ref(getSetting<string>('paraFontWeight'))
export const paraMargin = ref(getSetting<number>('paraMargin'))
export const paraIndent = ref(getSetting<string>('paraIndent'))

watch(paraFontSize, (v) => setSetting('paraFontSize', v))
watch(paraLineHeight, (v) => setSetting('paraLineHeight', v))
watch(paraFontWeight, (v) => setSetting('paraFontWeight', v))
watch(paraMargin, (v) => setSetting('paraMargin', v))
watch(paraIndent, (v) => setSetting('paraIndent', v))
