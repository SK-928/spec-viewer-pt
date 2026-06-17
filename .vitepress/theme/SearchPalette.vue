<script setup lang="ts">
// 検索パレット（モック07準拠）。
// docs-data.ts のモック文書を対象に部分一致検索 + ハイライト + キーボード操作。
// 後段で minisearch（docs/*.md の本文検索）に差し替え。
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vitepress'
import { docs, sections, sectionMeta, subcategoryLabel, type SectionKey, type SpecDoc } from './docs-data'

const emit = defineEmits<{ (e: 'close'): void }>()
const router = useRouter()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const sectionFilter = ref<'all' | SectionKey>('all')
const selectedIndex = ref(0)

// IME 変換中フラグ（日本語入力の変換確定 Enter を結果選択と誤認しないため）
const composing = ref(false)

// 検索結果（title / description / subcategory の部分一致。大小区別なし）
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      subcategoryLabel(d.subcategory).toLowerCase().includes(q)
  )
})

// セクションフィルタ適用後
const filtered = computed(() =>
  sectionFilter.value === 'all'
    ? results.value
    : results.value.filter((d) => d.section === sectionFilter.value)
)

// セクション毎のヒット件数（ツールバーのタブ表示用）
const sectionCounts = computed(() => {
  const c: Record<SectionKey, number> = { api: 0, ui: 0, guide: 0 }
  for (const d of results.value) c[d.section]++
  return c
})

const filterOptions = computed(() => [
  { key: 'all' as const, label: 'すべて', count: results.value.length },
  ...sections.map((s) => ({ key: s.key, label: s.label, count: sectionCounts.value[s.key] })),
])

// query 変更で選択をリセット。filtered 変更（フィルタ切替含む）でもリセット
watch(query, () => {
  selectedIndex.value = 0
  sectionFilter.value = 'all'
})
watch(filtered, () => {
  selectedIndex.value = 0
})

// ハイライト: query を <mark> で囲む。XSS 対策で先に HTML エスケープ
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function highlight(text: string): string {
  const q = query.value.trim()
  const escaped = escapeHtml(text)
  if (!q) return escaped
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(re, '<mark>$1</mark>')
}

// 結果クリック: SPA 遷移してモーダルを閉じる（href="#" のモックは遷移せず閉じるだけ）
function onSelect(e: MouseEvent, d: SpecDoc) {
  e.preventDefault()
  if (d.href && d.href !== '#') router.go(d.href)
  emit('close')
}

function openSelected() {
  const d = filtered.value[selectedIndex.value]
  if (d && d.href && d.href !== '#') router.go(d.href)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  // IME 変換中（日本語入力の変換候補選び・確定）はショートカットを無視
  if (composing.value || e.isComposing) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    openSelected()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  nextTick(() => inputRef.value?.focus())
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- オーバーレイ -->
  <div
    class="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="mx-auto w-full max-w-2xl px-4 mt-[8vh]">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        <!-- input row -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <svg class="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="flex-1 outline-none text-lg text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent"
            placeholder="設計書を検索…"
            aria-label="設計書を検索"
            @compositionstart="composing = true"
            @compositionend="composing = false"
          >
          <kbd class="border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 text-[11px]">esc</kbd>
        </div>

        <!-- toolbar: count + section filter（query 有り時のみ） -->
        <div v-if="query" class="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ filtered.length }}件</span>
          <div class="ml-auto inline-flex items-center gap-1">
            <button
              v-for="opt in filterOptions"
              :key="opt.key"
              type="button"
              @click="sectionFilter = opt.key"
              :class="sectionFilter === opt.key
                ? 'text-xs px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                : 'text-xs px-2.5 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
            >{{ opt.label }}{{ opt.key !== 'all' ? ' ' + opt.count : '' }}</button>
          </div>
        </div>

        <!-- results -->
        <div class="max-h-[52vh] overflow-y-auto">
          <a
            v-for="(d, i) in filtered"
            :key="d.title"
            :href="d.href"
            @click="onSelect($event, d)"
            :class="i === selectedIndex
              ? 'block px-5 py-3.5 bg-brand-50 dark:bg-brand-500/10 border-l-2 border-brand-500'
              : 'block px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-transparent'"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] font-semibold" :class="sectionMeta(d.section)!.accentText">{{ sectionMeta(d.section)!.label }}</span>
              <span class="text-[11px] text-slate-400 dark:text-slate-500">› {{ subcategoryLabel(d.subcategory) }}</span>
            </div>
            <p class="font-medium text-slate-900 dark:text-slate-100 truncate" v-html="highlight(d.title)"></p>
            <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-1" v-html="highlight(d.description)"></p>
          </a>

          <!-- 空: query 有りだが結果なし -->
          <div v-if="query && filtered.length === 0" class="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            該当する文書はありません
          </div>
          <!-- query 空: 入力待ち -->
          <div v-if="!query" class="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            キーワードを入力してください
          </div>
        </div>

        <!-- footer hints -->
        <div class="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-400 dark:text-slate-500">
          <span class="flex items-center gap-1.5"><kbd class="border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 dark:border-slate-700">↑</kbd><kbd class="border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 dark:border-slate-700">↓</kbd> 選択</span>
          <span class="flex items-center gap-1.5"><kbd class="border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 dark:border-slate-700">↵</kbd> 開く</span>
          <span class="flex items-center gap-1.5"><kbd class="border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 dark:border-slate-700">esc</kbd> 閉じる</span>
          <span class="ml-auto">プロトタイプ検索（実データ連携は後段）</span>
        </div>
      </div>
    </div>
  </div>
</template>
