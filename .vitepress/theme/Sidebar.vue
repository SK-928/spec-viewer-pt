<script setup lang="ts">
// セクションサイドバー（セクション一覧・doc 画面で共有）。
// DESIGN.md §7: 現セクションのツリー（サブカテゴリ → 文書）＋他セクション＋全体折たたみ（« / Ctrl+B）
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'
import { sectionMeta, sections, subcategoriesOf } from './docs-data'

const props = defineProps<{ section: string }>()

const route = useRoute()
const meta = computed(() => sectionMeta(props.section))
const subcategories = computed(() => subcategoriesOf(props.section))
const otherSections = computed(() => sections.filter((s) => s.key !== props.section))

// 現在表示中の文書をハイライト（route.path / href を末尾スラッシュと .html を除去して比較）
function isActive(href: string): boolean {
  if (!href || href === '#') return false
  const norm = (s: string) => s.replace(/\/$/, '').replace(/\.html$/, '')
  return norm(route.path) === norm(href)
}

// ツリー折たたみ（セクション別 localStorage。デフォルト = 全展開）
const treeKey = computed(() => `sv-tree-${props.section}`)
const collapsedCats = ref<Record<string, boolean>>({})
function isExpanded(name: string): boolean {
  return collapsedCats.value[name] !== true
}
function toggleCat(name: string) {
  collapsedCats.value = { ...collapsedCats.value, [name]: isExpanded(name) }
  try {
    const collapsed = Object.keys(collapsedCats.value).filter((k) => collapsedCats.value[k])
    localStorage.setItem(treeKey.value, JSON.stringify(collapsed))
  } catch { /* ignore */ }
}

// 全体折たたみ（« / Ctrl+B / localStorage）
const sidebarCollapsed = ref(false)
const STORAGE_KEY = 'sv-sidebar'
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  try { localStorage.setItem(STORAGE_KEY, sidebarCollapsed.value ? '1' : '0') } catch { /* ignore */ }
}
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}

// 幅リサイズ（右端ドラッグ。localStorage で永続化）
const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 224 // w-56 相当
const COLLAPSED_WIDTH = 48 // 閉じたときの細幅（展開ボタンのみ表示）
const WIDTH_KEY = 'sv-sidebar-width'
const asideRef = ref<HTMLElement | null>(null)
const sidebarWidth = ref(DEFAULT_WIDTH)
const resizing = ref(false)
let asideLeft = 0

function startResize(e: PointerEvent) {
  e.preventDefault()
  resizing.value = true
  asideLeft = asideRef.value ? asideRef.value.getBoundingClientRect().left : 0
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', endResize)
}
function onResizeMove(e: PointerEvent) {
  if (!resizing.value) return
  const next = e.clientX - asideLeft
  sidebarWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next))
}
function endResize() {
  if (!resizing.value) return
  resizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', endResize)
  try { localStorage.setItem(WIDTH_KEY, String(sidebarWidth.value)) } catch { /* ignore */ }
}
onMounted(() => {
  try { sidebarCollapsed.value = localStorage.getItem(STORAGE_KEY) === '1' } catch { /* ignore */ }
  try {
    const collapsed = JSON.parse(localStorage.getItem(treeKey.value) || '[]') as string[]
    collapsedCats.value = Object.fromEntries(collapsed.map((k) => [k, true]))
  } catch { /* ignore */ }
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY))
    if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) sidebarWidth.value = saved
  } catch { /* ignore */ }
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', endResize)
})
</script>

<template>
  <aside
    v-if="meta"
    ref="asideRef"
    :style="{ width: (sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth) + 'px' }"
    class="hidden lg:block shrink-0 relative py-8 border-r border-slate-100 dark:border-slate-800 overflow-hidden"
    :class="resizing ? '' : 'transition-[width] duration-150 ease-out'"
  >
    <!-- 縮小時: 展開ボタンのみ（ペイン上部） -->
    <button
      v-if="sidebarCollapsed"
      type="button"
      @click="toggleSidebar"
      class="grid place-items-center w-8 h-8 mx-auto rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
      title="サイドバーを表示 (Ctrl+B)"
      aria-label="サイドバーを表示"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
    </button>

    <template v-else>
    <div class="flex items-center justify-between px-3 mb-3">
      <p class="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">{{ meta.label }}</p>
      <button
        type="button"
        @click="toggleSidebar"
        class="grid place-items-center w-6 h-6 -mr-1 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
        title="サイドバーを隠す (Ctrl+B)"
        aria-label="サイドバーを隠す"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>
      </button>
    </div>

    <nav class="text-sm flex flex-col">
      <div v-for="cat in subcategories" :key="cat.name" class="mb-1">
        <button
          type="button"
          @click="toggleCat(cat.name)"
          class="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <svg
            class="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 transition-transform"
            :class="isExpanded(cat.name) ? '' : '-rotate-90'"
            fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 20 20"
          ><path d="M5.5 7.5 10 12l4.5-4.5"/></svg>
          <span class="truncate">{{ cat.name }}</span>
          <span class="ml-auto text-[11px] text-slate-400 dark:text-slate-500">{{ cat.docs.length }}</span>
        </button>
        <div v-show="isExpanded(cat.name)" class="ml-2 border-l border-slate-100 dark:border-slate-800 pl-2 mt-0.5">
          <a
            v-for="d in cat.docs"
            :key="d.title"
            :href="d.href"
            :class="isActive(d.href)
              ? 'block px-3 py-1.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium truncate'
              : 'block px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 truncate'"
          >{{ d.title }}</a>
        </div>
      </div>
    </nav>

    <div class="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
      <p class="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">他のセクション</p>
      <nav class="text-sm flex flex-col">
        <a
          v-for="s in otherSections"
          :key="s.key"
          :href="s.navHref"
          class="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
        >{{ s.label }} <span class="text-slate-400 dark:text-slate-500">↗</span></a>
      </nav>
    </div>
    </template>

    <!-- 幅リサイズハンドル（展開時のみ） -->
    <div
      v-if="!sidebarCollapsed"
      @pointerdown="startResize"
      title="ドラッグで幅を変更"
      class="absolute top-0 bottom-0 right-0 w-1 cursor-col-resize z-10"
      :class="resizing ? 'bg-brand-500/60' : 'bg-transparent hover:bg-brand-400/40'"
    ></div>
  </aside>
</template>
