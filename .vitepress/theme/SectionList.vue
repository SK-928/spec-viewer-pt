<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { docsBySection, sectionMeta, statusMeta, subcategoryTree, flattenSubcatTree, subcategoryMatches, subcategoryLabel, type DocStatus } from './docs-data'
import SectionIcon from './SectionIcon.vue'
import Sidebar from './Sidebar.vue'

const props = defineProps<{ section: string }>()

const meta = computed(() => sectionMeta(props.section)!)
const sectionDocs = computed(() => docsBySection(props.section))

// フィルタ: ステータス・サブカテゴリ／並び順
type StatusFilter = 'all' | DocStatus
const statusFilter = ref<StatusFilter>('all')
const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: '承認済み', label: '承認済み' },
  { key: 'レビュー中', label: 'レビュー中' },
  { key: 'ドラフト', label: 'ドラフト' },
]

const subcategoryFilter = ref<string>('all')

type SortOrder = 'updated' | 'title'
const sortOrder = ref<SortOrder>('updated')
const sortOptions: { key: SortOrder; label: string }[] = [
  { key: 'updated', label: '更新順' },
  { key: 'title', label: 'タイトル順' },
]

// docs-data は全体を新しい順に保持 → 更新順は配列順を維持。タイトル順は localeCompare
const filteredDocs = computed(() => {
  let list = sectionDocs.value
  if (statusFilter.value !== 'all') list = list.filter((d) => d.status === statusFilter.value)
  if (subcategoryFilter.value !== 'all') list = list.filter((d) => subcategoryMatches(d.subcategory, subcategoryFilter.value))
  return sortOrder.value === 'title'
    ? [...list].sort((a, b) => a.title.localeCompare(b.title, 'ja'))
    : list
})

// サブカテゴリフィルタの選択肢（メニュー用）。
// 「すべて」+ ツリーを平坦化した全ノード（depth でインデント）。キーはパス文字列
const subcategoryOptions = computed(() => [
  { key: 'all', label: 'すべて', depth: 0 },
  ...flattenSubcatTree(subcategoryTree(props.section)).map((n) => ({
    key: n.key,
    label: n.name || '(未分類)',
    depth: n.depth,
    count: n.count,
  })),
])
// 選択中フィルタのボタン表示ラベル。パス（"認証/トークン"）→"認証 › トークン"
const subcategoryFilterLabel = computed(() => {
  if (subcategoryFilter.value === 'all') return 'すべて'
  if (!subcategoryFilter.value) return '(未分類)'
  return subcategoryFilter.value.split('/').join(' › ')
})

// ドロップダウン開閉（サブカテゴリ / 並び順）。同時に開くのは1つだけ
const openMenu = ref<'subcategory' | 'sort' | null>(null)
const subcategoryRef = ref<HTMLElement | null>(null)
const sortRef = ref<HTMLElement | null>(null)
function toggleMenu(menu: 'subcategory' | 'sort') {
  openMenu.value = openMenu.value === menu ? null : menu
}
function selectSubcategory(key: string) {
  subcategoryFilter.value = key
  openMenu.value = null
}
function selectSort(key: SortOrder) {
  sortOrder.value = key
  openMenu.value = null
}
// 外側クリックでドロップダウンを閉じる（@vueuse/core はプロジェクト直接依存ではないため軽量に自前実装）
function onClickOutside(targetRef: { value: HTMLElement | null }, handler: () => void) {
  function onPointerDown(e: PointerEvent) {
    const el = targetRef.value
    if (el && !el.contains(e.target as Node)) handler()
  }
  onMounted(() => document.addEventListener('pointerdown', onPointerDown))
  onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown))
}
onClickOutside(subcategoryRef, () => { if (openMenu.value === 'subcategory') openMenu.value = null })
onClickOutside(sortRef, () => { if (openMenu.value === 'sort') openMenu.value = null })

// Esc でドロップダウンを閉じる
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openMenu.value) {
    openMenu.value = null
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Breadcrumb -->
    <div class="border-b border-slate-100 dark:border-slate-800">
      <div class="mx-auto max-w-7xl px-6 py-3 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <a href="/" class="hover:text-slate-600 dark:hover:text-slate-300">ホーム</a>
        <span>/</span>
        <span class="text-slate-600 dark:text-slate-300">{{ meta.label }}</span>
      </div>
    </div>

    <!-- doc-shell -->
    <div class="mx-auto max-w-7xl px-6 flex gap-10 w-full flex-1">
      <Sidebar :section="props.section" />

      <!-- Main: section list -->
      <main class="py-10 min-w-0 flex-1">

        <!-- section header -->
        <div class="flex items-center gap-2 mb-2">
          <span class="grid place-items-center w-7 h-7 rounded-lg" :class="meta.iconClass">
            <SectionIcon :section="meta.key" class="w-4 h-4" />
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ sectionDocs.length }}件</span>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{{ meta.label }}</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl">{{ meta.description }}</p>

        <!-- filter toolbar -->
        <div class="flex flex-wrap items-center gap-2 mt-8 mb-5">
          <!-- status: segmented -->
          <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900">
            <button
              v-for="opt in statusOptions"
              :key="opt.key"
              type="button"
              @click="statusFilter = opt.key"
              :class="statusFilter === opt.key
                ? 'px-3 py-1 text-sm rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100'
                : 'px-3 py-1 text-sm rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
            >{{ opt.label }}</button>
          </div>
          <!-- subcategory dropdown -->
          <div ref="subcategoryRef" class="relative">
            <button
              type="button"
              @click="toggleMenu('subcategory')"
              class="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              サブカテゴリ: {{ subcategoryFilterLabel }}
              <svg
                class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform"
                :class="openMenu === 'subcategory' ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              ><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div
              v-show="openMenu === 'subcategory'"
              class="absolute top-full left-0 mt-1 z-20 min-w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1"
            >
              <button
                v-for="opt in subcategoryOptions"
                :key="opt.key"
                type="button"
                @click="selectSubcategory(opt.key)"
                :style="{ paddingLeft: 12 + opt.depth * 16 + 'px' }"
                :class="subcategoryFilter === opt.key
                  ? 'w-full flex items-center pr-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'w-full flex items-center pr-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >
                <span class="truncate">{{ opt.label }}</span>
                <span v-if="opt.key !== 'all'" class="ml-2 text-[11px] text-slate-400 dark:text-slate-500">{{ opt.count }}</span>
                <svg v-if="subcategoryFilter === opt.key" class="ml-auto w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              </button>
            </div>
          </div>

          <!-- sort dropdown -->
          <div ref="sortRef" class="relative">
            <button
              type="button"
              @click="toggleMenu('sort')"
              class="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              並び順: {{ sortOptions.find((o) => o.key === sortOrder)?.label }}
              <svg
                class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform"
                :class="openMenu === 'sort' ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              ><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div
              v-show="openMenu === 'sort'"
              class="absolute top-full left-0 mt-1 z-20 min-w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1"
            >
              <button
                v-for="opt in sortOptions"
                :key="opt.key"
                type="button"
                @click="selectSort(opt.key)"
                :class="sortOrder === opt.key
                  ? 'w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >
                {{ opt.label }}
                <svg v-if="sortOrder === opt.key" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              </button>
            </div>
          </div>
          <span class="ml-auto text-sm text-slate-400 dark:text-slate-500">{{ filteredDocs.length }}件 / {{ sectionDocs.length }}件</span>
        </div>

        <!-- doc list -->
        <div
          v-if="filteredDocs.length === 0"
          class="border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
        >
          該当する文書はありません
        </div>
        <div v-else class="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          <a
            v-for="d in filteredDocs"
            :key="d.title"
            :href="d.href"
            class="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
          >
            <div class="min-w-0 flex-1">
              <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ subcategoryLabel(d.subcategory) }}</span>
              <p class="font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300 truncate">
                {{ d.title }}
                <span v-if="d.method" class="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-normal">{{ d.method }}</span>
              </p>
              <p class="text-sm text-slate-400 dark:text-slate-500 truncate">{{ d.description }}</p>
            </div>
            <div class="hidden sm:flex items-center text-xs">
              <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium" :class="statusMeta[d.status].class">
                <span class="status-dot" :class="statusMeta[d.status].dot"></span>{{ d.status }}
              </span>
            </div>
            <div class="hidden md:block w-20 text-right text-xs text-slate-400 dark:text-slate-500">{{ d.updated }}</div>
          </a>
        </div>

        <p class="mt-4 text-xs text-slate-400 dark:text-slate-500">{{ sectionDocs.length }}件中 1〜{{ filteredDocs.length }}件を表示</p>
      </main>
    </div>
  </div>
</template>
