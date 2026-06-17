<script setup lang="ts">
// セクションサイドバー（セクション一覧・doc 画面で共有）。
// DESIGN.md §7: 現セクションのツリー（サブカテゴリ → 文書）＋他セクション＋全体折たたみ（« / Ctrl+B）
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute } from 'vitepress'
import { sectionMeta, sections, subcategoryTree } from './docs-data'
import SidebarTree from './SidebarTree.vue'
import { SIDEBAR_CTX } from './sidebar-ctx'
import { useSidebarChrome } from './useSidebarChrome'

const props = defineProps<{ section: string }>()

const route = useRoute()
const meta = computed(() => sectionMeta(props.section))
const tree = computed(() => subcategoryTree(props.section))
const otherSections = computed(() => sections.filter((s) => s.key !== props.section))

// 現在表示中の文書をハイライト（route.path / href を末尾スラッシュと .html を除去して比較）
function isActive(href: string): boolean {
  if (!href || href === '#') return false
  const norm = (s: string) => s.replace(/\/$/, '').replace(/\.html$/, '')
  return norm(route.path) === norm(href)
}

// ツリー折たたみ（セクション別 localStorage。デフォルト = 全展開）。キーはノードパス文字列
const treeKey = computed(() => `sv-tree-${props.section}`)
const collapsedCats = ref<Record<string, boolean>>({})
function isExpanded(path: string): boolean {
  return collapsedCats.value[path] !== true
}
function toggleCat(path: string) {
  collapsedCats.value = { ...collapsedCats.value, [path]: isExpanded(path) }
  try {
    const collapsed = Object.keys(collapsedCats.value).filter((k) => collapsedCats.value[k])
    localStorage.setItem(treeKey.value, JSON.stringify(collapsed))
  } catch { /* ignore */ }
}
// 子コンポーネント(SidebarTree)へ折たたみ状態・active 判定を共有
provide(SIDEBAR_CTX, { isExpanded, toggleCat, isActive })

// 幅リサイズ + « / Ctrl+B 全体折りたたみ（useSidebarChrome で DepsMap と共有）
const { sidebarCollapsed, sidebarWidth, resizing, asideRef, toggleSidebar, startResize, COLLAPSED_WIDTH } = useSidebarChrome()

// ツリー折たたみ状態の復元（セクション別 localStorage）
onMounted(() => {
  try {
    const collapsed = JSON.parse(localStorage.getItem(treeKey.value) || '[]') as string[]
    collapsedCats.value = Object.fromEntries(collapsed.map((k) => [k, true]))
  } catch { /* ignore */ }
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
      <SidebarTree v-for="node in tree" :key="node.path || '__root__'" :node="node" />
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
