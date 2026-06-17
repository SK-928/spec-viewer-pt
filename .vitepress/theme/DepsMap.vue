<script setup lang="ts">
// 依存関係マップ（モック08準拠）。
// 文書フォーカス型: 選択文書を中央に、依存先（前提）を左、被依存（影響先）を右に配置。
// 矢印 A→B は「AがBに依存」。ノードクリックで中心切替。
// 間接依存（依存の依存）は直接依存のさらに左（2個先）に faded 表示。範囲でセレクタをセクション絞り込み
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'
import { docs, docByTitle, docByPath, dependentsOf, sectionMeta, statusMeta, sections, docsBySection, subcategoryLabel, type SpecDoc, type DocStatus, type SectionKey } from './docs-data'

// 選択文書。?doc=<title> があればそれを、無ければ未選択（グラフに「文書を選択してください」を表示）
// VitePress の route.query は文字列（'?doc=...'）なので正規表現で抽出
const route = useRoute()
const selected = ref<string>('')
function docFromQuery(q: unknown): string | null {
  if (typeof q !== 'string' || !q) return null
  const m = q.match(/[?&]doc=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
watch(
  () => route.query,
  (q) => {
    const doc = docFromQuery(q)
    if (doc) {
      const d = docByTitle(doc)
      if (d) selected.value = d.title
    }
  },
  { immediate: true }
)
// クライアント側で URL の ?doc= を確実に反映（route.query のタイミングに依存しない保険）
onMounted(() => {
  if (typeof window === 'undefined') return
  const doc = new URLSearchParams(window.location.search).get('doc')
  if (doc) {
    const d = docByTitle(doc)
    if (d) selected.value = d.title
  }
})

const selectedDoc = computed(() => docByTitle(selected.value))
function select(title: string) { selected.value = title }

const dependents = computed(() => (selectedDoc.value ? dependentsOf(selectedDoc.value.path) : []))
const meta = computed(() => (selectedDoc.value ? sectionMeta(selectedDoc.value.section) : undefined))

// 範囲: セレクタのセクション絞り込み
const scope = ref<'all' | SectionKey>('all')

// 直接依存（深さ1）ごとに、その前提（深さ2＝間接依存）を束ねた階層構造。
// 選択文書自身と他の直接依存は深さ2から除外し、循環（order↔order-state 等）の戻り参照を切る。
interface DirectDep { doc: SpecDoc; indirect: SpecDoc[] }
const directDeps = computed<DirectDep[]>(() => {
  const sel = selectedDoc.value
  if (!sel) return []
  const direct = (sel.dependsOn || []).map((p) => docByPath(p)).filter((d): d is SpecDoc => !!d)
  const exclude = new Set([sel.path, ...direct.map((d) => d.path)])
  return direct.map((d) => {
    const seen = new Set<string>()
    const indirect: SpecDoc[] = []
    for (const p of d.dependsOn || []) {
      const dd = docByPath(p)
      if (!dd || exclude.has(dd.path) || seen.has(dd.path)) continue
      seen.add(dd.path)
      indirect.push(dd)
    }
    return { doc: d, indirect }
  })
})
// 間接依存のフラットリスト（ノード描画用・重複排除済み）
const indirectDeps = computed<SpecDoc[]>(() => {
  const seen = new Set<string>(); const list: SpecDoc[] = []
  for (const dd of directDeps.value) for (const d of dd.indirect) {
    if (!seen.has(d.path)) { seen.add(d.path); list.push(d) }
  }
  return list
})
// 間接依存を表示するか（1件以上あれば、直接依存のさらに左に2個先として描画）
const hasIndirect = computed(() => indirectDeps.value.length > 0)
// 深さ1 → 深さ2 のエッジ。fromIdx/toIdx は各リスト内の添字
const indirectEdges = computed(() => {
  const idxOf = new Map(indirectDeps.value.map((d, i) => [d.path, i] as const))
  const edges: { fromIdx: number; toIdx: number }[] = []
  directDeps.value.forEach((dd, fromIdx) => {
    for (const d of dd.indirect) {
      const toIdx = idxOf.get(d.path)
      if (toIdx !== undefined) edges.push({ fromIdx, toIdx })
    }
  })
  return edges
})

// ドロップダウン開閉（範囲）
const openMenu = ref<'scope' | null>(null)
const scopeRef = ref<HTMLElement | null>(null)
function toggleMenu(menu: 'scope') {
  openMenu.value = openMenu.value === menu ? null : menu
}
// 外側クリックで閉じる（@vueuse/core 非依存の自前実装）
function onClickOutside(targetRef: { value: HTMLElement | null }, handler: () => void) {
  function onPointerDown(e: PointerEvent) {
    const el = targetRef.value
    if (el && !el.contains(e.target as Node)) handler()
  }
  onMounted(() => document.addEventListener('pointerdown', onPointerDown))
  onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown))
}
onClickOutside(scopeRef, () => { if (openMenu.value === 'scope') openMenu.value = null })
const scopeLabel = computed(() => (scope.value === 'all' ? 'すべて' : sectionMeta(scope.value)?.label || scope.value))

// グラフ座標（SVG viewBox 上）。深さ2のとき farLeft 列を追加して4列化。
const NODE_W = 150
const NODE_H = 48
const GAP = 74
const TOP = 56
// 列レイアウト。深さ2のとき farLeft を追加（4列）。3列時の farLeft は未使用（型統一のため 0）。
interface ColLayout { farLeft: number; left: number; center: number; right: number }
const cols = computed<ColLayout>(() => {
  if (hasIndirect.value) return { farLeft: 20, left: 240, center: 460, right: 680 }
  return { farLeft: 0, left: 20, center: 295, right: 570 }
})
const svgW = computed(() => (hasIndirect.value ? 850 : 740))

const graphHeight = computed(() => {
  const n = Math.max(directDeps.value.length, indirectDeps.value.length, dependents.value.length, 1)
  return TOP + n * GAP + 40
})
function colY(i: number, total: number) {
  const contentH = total * GAP
  const startY = TOP + (graphHeight.value - TOP - contentH) / 2 - GAP / 2
  return startY + i * GAP + GAP / 2 - NODE_H / 2
}
const centerY = computed(() => graphHeight.value / 2 - NODE_H / 2)

function statusDot(status: DocStatus): string {
  return { '承認済み': 'fill-emerald-500', 'レビュー中': 'fill-amber-500', 'ドラフト': 'fill-slate-400' }[status]
}

// セレクタ用: 範囲でセクション絞り込み
const filteredSelectorSections = computed(() => {
  const list = scope.value === 'all' ? sections : sections.filter((s) => s.key === scope.value)
  return list.map((s) => ({ meta: s, docs: docsBySection(s.key) }))
})
function hasLinks(d: SpecDoc): boolean {
  return !!(d.dependsOn?.length || dependentsOf(d.path).length)
}
</script>

<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Breadcrumb -->
    <div class="border-b border-slate-100 dark:border-slate-800">
      <div class="mx-auto max-w-7xl px-6 py-3 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <a href="/" class="hover:text-slate-600 dark:hover:text-slate-300">ホーム</a>
        <span>/</span>
        <span class="text-slate-600 dark:text-slate-300">依存関係マップ</span>
      </div>
    </div>

    <!-- sub toolbar -->
    <div class="mx-auto max-w-7xl px-6 pt-8 w-full">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">依存関係マップ</h1>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">文書を選ぶと、依存（前提）と被依存（影響先）を中心に表示します。矢印 A→B は「AがBに依存」。</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- scope dropdown -->
          <div ref="scopeRef" class="relative">
            <button
              type="button"
              @click="toggleMenu('scope')"
              class="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >範囲: {{ scopeLabel }}
              <svg class="w-3.5 h-3.5 text-slate-400 transition-transform" :class="openMenu === 'scope' ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div v-show="openMenu === 'scope'" class="absolute top-full right-0 mt-1 z-20 min-w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
              <button type="button" @click="scope = 'all'; openMenu = null" :class="scope === 'all' ? 'w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800' : 'w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'">すべて<svg v-if="scope === 'all'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></button>
              <button v-for="s in sections" :key="s.key" type="button" @click="scope = s.key; openMenu = null" :class="scope === s.key ? 'w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800' : 'w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'">{{ s.label }}<svg v-if="scope === s.key" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3-column -->
    <div class="mx-auto max-w-7xl px-6 py-6 flex gap-6 w-full flex-1">

      <!-- left: selector -->
      <aside class="hidden lg:block w-60 shrink-0">
        <div v-for="s in filteredSelectorSections" :key="s.meta.key" class="mb-4">
          <p class="px-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">{{ s.meta.label }}</p>
          <nav class="text-sm flex flex-col">
            <button
              v-for="d in s.docs"
              :key="d.title"
              type="button"
              @click="select(d.title)"
              :class="selected === d.title
                ? 'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium text-left'
                : 'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-left'"
            >
              <span class="truncate">{{ d.title }}</span>
              <span v-if="hasLinks(d)" class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">●</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- center: graph -->
      <main class="min-w-0 flex-1">
        <div v-if="selectedDoc" class="canvas-grid border border-slate-200 dark:border-slate-700 rounded-2xl p-3 overflow-hidden">
          <svg :viewBox="`0 0 ${svgW} ${graphHeight}`" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#818cf8"/>
              </marker>
              <marker id="arrow-faded" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#cbd5e1"/>
              </marker>
            </defs>

            <!-- column labels -->
            <text v-if="hasIndirect" :x="cols.farLeft + 10" y="32" font-size="11" font-weight="600" fill="#94a3b8" font-family="Inter,sans-serif">間接（2個先）</text>
            <text :x="cols.left + 10" y="32" font-size="11" font-weight="600" fill="#94a3b8" font-family="Inter,sans-serif">前提（依存先）</text>
            <text :x="cols.center + 30" y="32" font-size="11" font-weight="600" fill="#6366f1" font-family="Inter,sans-serif">選択文書</text>
            <text :x="cols.right + 10" y="32" font-size="11" font-weight="600" fill="#94a3b8" font-family="Inter,sans-serif">影響先（被依存）</text>

            <!-- edges: 選択 → 各前提（直接依存） -->
            <line
              v-for="(dd, i) in directDeps" :key="'el-' + dd.doc.title"
              :x1="cols.center" :y1="centerY + (NODE_H + 14) / 2"
              :x2="cols.left + NODE_W" :y2="colY(i, directDeps.length) + NODE_H / 2"
              stroke="#818cf8" stroke-width="2" marker-end="url(#arrow)"
            />
            <!-- edges: 直接依存 → 間接依存（深さ2, faded） -->
            <line
              v-for="(e, i) in indirectEdges" :key="'ei-' + i"
              :x1="cols.left" :y1="colY(e.fromIdx, directDeps.length) + NODE_H / 2"
              :x2="cols.farLeft + NODE_W" :y2="colY(e.toIdx, indirectDeps.length) + NODE_H / 2"
              stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow-faded)"
            />
            <!-- edges: 影響先 → 選択（被依存） -->
            <line
              v-for="(d, i) in dependents" :key="'er-' + d.title"
              :x1="cols.right" :y1="colY(i, dependents.length) + NODE_H / 2"
              :x2="cols.center + NODE_W + 10" :y2="centerY + (NODE_H + 14) / 2"
              stroke="#818cf8" stroke-width="2" marker-end="url(#arrow)"
            />

            <!-- farLeft nodes（間接依存・深さ2）。faded -->
            <g v-for="(d, i) in indirectDeps" :key="'nfl-' + d.title" @click="select(d.title)" class="cursor-pointer opacity-50">
              <rect :x="cols.farLeft" :y="colY(i, indirectDeps.length)" :width="NODE_W" :height="NODE_H" rx="10" class="fill-white dark:fill-slate-900" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 3"/>
              <circle :cx="cols.farLeft + 14" :cy="colY(i, indirectDeps.length) + NODE_H / 2" r="4" :class="statusDot(d.status)"/>
              <text :x="cols.farLeft + 24" :y="colY(i, indirectDeps.length) + NODE_H / 2 + 4" font-size="12" font-weight="600" class="fill-slate-500 dark:fill-slate-400" font-family="Inter,sans-serif">{{ d.title }}</text>
            </g>

            <!-- left nodes（前提・直接依存） -->
            <g v-for="(dd, i) in directDeps" :key="'nl-' + dd.doc.title" @click="select(dd.doc.title)" class="cursor-pointer">
              <rect :x="cols.left" :y="colY(i, directDeps.length)" :width="NODE_W" :height="NODE_H" rx="10" class="fill-white dark:fill-slate-900" stroke="#94a3b8" stroke-width="1.5"/>
              <circle :cx="cols.left + 14" :cy="colY(i, directDeps.length) + NODE_H / 2" r="4" :class="statusDot(dd.doc.status)"/>
              <text :x="cols.left + 24" :y="colY(i, directDeps.length) + NODE_H / 2 + 4" font-size="12" font-weight="600" class="fill-slate-900 dark:fill-slate-100" font-family="Inter,sans-serif">{{ dd.doc.title }}</text>
            </g>

            <!-- center node（選択） -->
            <g v-if="selectedDoc">
              <rect :x="cols.center" :y="centerY" :width="NODE_W + 10" :height="NODE_H + 14" rx="12" class="fill-brand-50 dark:fill-brand-500/20" stroke="#6366f1" stroke-width="2.5"/>
              <circle :cx="cols.center + 16" :cy="centerY + 22" r="5" :class="statusDot(selectedDoc.status)"/>
              <text :x="cols.center + 28" :y="centerY + 26" font-size="13" font-weight="700" class="fill-slate-900 dark:fill-slate-100" font-family="Inter,sans-serif">{{ selectedDoc.title }}</text>
              <text :x="cols.center + 16" :y="centerY + NODE_H + 6" font-size="10" font-weight="600" fill="#4f46e5" font-family="Inter,sans-serif">{{ meta?.label }} · 選択中</text>
            </g>

            <!-- right nodes（影響先） -->
            <g v-for="(d, i) in dependents" :key="'nr-' + d.title" @click="select(d.title)" class="cursor-pointer">
              <rect :x="cols.right" :y="colY(i, dependents.length)" :width="NODE_W" :height="NODE_H" rx="10" class="fill-white dark:fill-slate-900" stroke="#cbd5e1" stroke-width="1.5"/>
              <circle :cx="cols.right + 14" :cy="colY(i, dependents.length) + NODE_H / 2" r="4" :class="statusDot(d.status)"/>
              <text :x="cols.right + 24" :y="colY(i, dependents.length) + NODE_H / 2 + 4" font-size="12" font-weight="600" class="fill-slate-900 dark:fill-slate-100" font-family="Inter,sans-serif">{{ d.title }}</text>
            </g>
          </svg>
        </div>

        <!-- legend -->
        <div v-if="selectedDoc" class="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span class="flex items-center gap-1.5"><svg width="22" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#818cf8" stroke-width="2"/><polygon points="16,1 22,4 16,7" fill="#818cf8"/></svg> 直接依存</span>
          <span class="flex items-center gap-1.5"><svg width="22" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 2"/><polygon points="16,2 22,4 16,6" fill="#cbd5e1"/></svg> 間接依存（2個先）</span>
          <span class="flex items-center gap-1.5"><span class="status-dot bg-emerald-500"></span>承認済み</span>
          <span class="flex items-center gap-1.5"><span class="status-dot bg-amber-500"></span>レビュー中</span>
        </div>

        <div v-if="!selectedDoc" class="canvas-grid border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center min-h-85">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><line x1="7" y1="11" x2="17" y2="7"/><line x1="7" y1="13" x2="17" y2="17"/></svg>
            <p class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">文書を選択してください</p>
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">左のリストから文書を選ぶと、依存関係を表示します</p>
          </div>
        </div>
      </main>

      <!-- right: detail -->
      <aside class="hidden xl:block w-72 shrink-0">
        <div v-if="selectedDoc" class="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div class="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">選択中</div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ selectedDoc.title }}</h2>
          <div class="flex items-center gap-2 mt-2 text-xs">
            <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium" :class="statusMeta[selectedDoc.status].class">
              <span class="status-dot" :class="statusMeta[selectedDoc.status].dot"></span>{{ selectedDoc.status }}
            </span>
            <span class="text-slate-400 dark:text-slate-500">{{ meta?.label }} › {{ subcategoryLabel(selectedDoc.subcategory) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-5">
            <div class="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
              <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ directDeps.length }}</div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">依存している</div>
            </div>
            <div class="rounded-lg bg-brand-50 dark:bg-brand-500/10 p-3 text-center">
              <div class="text-2xl font-bold text-brand-700 dark:text-brand-300">{{ dependents.length }}</div>
              <div class="text-[11px] text-brand-600/80 dark:text-brand-400/80 mt-0.5">依存されている</div>
            </div>
          </div>

          <div v-if="directDeps.length" class="mt-5">
            <div class="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">依存している</div>
            <ul class="text-sm space-y-1.5">
              <li v-for="dd in directDeps" :key="dd.doc.title"><button type="button" @click="select(dd.doc.title)" class="text-brand-600 dark:text-brand-400 hover:underline">{{ dd.doc.title }}</button></li>
            </ul>
          </div>

          <div v-if="dependents.length" class="mt-5">
            <div class="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">依存されている</div>
            <ul class="text-sm space-y-1.5">
              <li v-for="d in dependents" :key="d.title"><button type="button" @click="select(d.title)" class="text-brand-600 dark:text-brand-400 hover:underline">{{ d.title }}</button></li>
            </ul>
          </div>

          <a :href="selectedDoc.href === '#' ? '/deps/' : selectedDoc.href" class="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg px-4 py-2.5">文書を開く →</a>
        </div>
        <p v-if="selectedDoc" class="text-xs text-slate-400 dark:text-slate-500 mt-3 leading-relaxed px-1">ノードをクリックで中心を切り替え。間接依存（2個先）もあわせて表示。</p>

        <div v-if="!selectedDoc" class="border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">文書を選択してください</p>
          <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">左のリストから選んでください</p>
        </div>
      </aside>
    </div>
  </div>
</template>
