<script setup lang="ts">
// サイドバーのサブカテゴリツリー（再帰）。任意の深さに対応。
// 折たたみ状態・active 判定は親 Sidebar.vue から provide/inject で共有。
import { inject, defineOptions } from 'vue'
import type { SubcatNode } from './docs-data'
import { SIDEBAR_CTX } from './sidebar-ctx'

defineOptions({ name: 'SidebarTree' })

const props = defineProps<{ node: SubcatNode }>()
const ctx = inject(SIDEBAR_CTX)!

// 配下（子孫）を含む文書総数
function totalCount(n: SubcatNode): number {
  return n.docs.length + n.children.reduce((acc, c) => acc + totalCount(c), 0)
}
</script>

<template>
  <div class="mb-1">
    <!-- 未分類(name='')はヘッダなし・常時展開 -->
    <button
      v-if="node.name !== ''"
      type="button"
      @click="ctx.toggleCat(node.path)"
      class="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <svg
        class="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 transition-transform"
        :class="ctx.isExpanded(node.path) ? '' : '-rotate-90'"
        fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 20 20"
      ><path d="M5.5 7.5 10 12l4.5-4.5"/></svg>
      <span class="truncate">{{ node.name }}</span>
      <span class="ml-auto text-[11px] text-slate-400 dark:text-slate-500">{{ totalCount(node) }}</span>
    </button>
    <div v-show="node.name === '' || ctx.isExpanded(node.path)" class="ml-2 border-l border-slate-100 dark:border-slate-800 pl-2 mt-0.5">
      <!-- 直下文書 -->
      <a
        v-for="d in node.docs"
        :key="d.title"
        :href="d.href"
        :class="ctx.isActive(d.href)
          ? 'block px-3 py-1.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium truncate'
          : 'block px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 truncate'"
      >{{ d.title }}</a>
      <!-- 子ノード（再帰） -->
      <SidebarTree v-for="child in node.children" :key="child.path" :node="child" />
    </div>
  </div>
</template>
