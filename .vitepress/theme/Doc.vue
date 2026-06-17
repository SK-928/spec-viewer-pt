<script setup lang="ts">
// doc 詳細/閲覧画面（モック05準拠）。
// 本文は <Content />（Markdown）。周囲にパンくず・サイドバー・doc header・prev/next・TOC を配置
import { computed, ref } from 'vue'
import { useData, useRoute, onContentUpdated } from 'vitepress'
import { docs, sectionMeta, statusMeta, subcategoryLabel, type DocStatus } from './docs-data'
import Sidebar from './Sidebar.vue'

const { frontmatter } = useData()
const route = useRoute()

// 現在の第1階層（api / ui / guide）
const section = computed(() => route.path.split('/')[1] || '')
const meta = computed(() => sectionMeta(section.value))

// route.path を docs-data の href 形式に正規化して現在文書を特定
const normalizedPath = computed(() => route.path.replace(/\/$/, '').replace(/\.html$/, ''))
const currentIndex = computed(() => docs.findIndex((d) => d.href === normalizedPath.value))
const currentDoc = computed(() => currentIndex.value >= 0 ? docs[currentIndex.value] : undefined)

// 依存関係マップへのリンク（現在文書を ?doc=<title> で渡し、その文書を初期選択させる）
const depsHref = computed(() =>
  currentDoc.value ? `/deps/?doc=${encodeURIComponent(currentDoc.value.title)}` : '/deps/'
)
const prevDoc = computed(() => currentIndex.value > 0 ? docs[currentIndex.value - 1] : null)
const nextDoc = computed(() => currentIndex.value >= 0 && currentIndex.value < docs.length - 1 ? docs[currentIndex.value + 1] : null)
const subcategory = computed(() => subcategoryLabel(currentDoc.value?.subcategory))

// TOC: VitePress 2.0-alpha では page.headers が空のため、Content レンダリング後に DOM から H2/H3 を抽出（クライアント側）
interface Header { level: number; title: string; slug: string }
const headers = ref<Header[]>([])
onContentUpdated(() => {
  if (typeof document === 'undefined') return
  const article = document.querySelector('.prose-doc')
  if (!article) { headers.value = []; return }
  headers.value = (Array.from(article.querySelectorAll('h2, h3')) as HTMLElement[]).map((el) => ({
    level: el.tagName === 'H2' ? 2 : 3,
    title: el.textContent || '',
    slug: el.id || '',
  }))
})

// frontmatter.status を DocStatus に絞る
const status = computed<DocStatus | undefined>(() => frontmatter.value.status as DocStatus | undefined)
</script>

<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Breadcrumb -->
    <div class="border-b border-slate-100 dark:border-slate-800">
      <div class="mx-auto max-w-7xl px-6 py-3 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <a :href="meta?.navHref || '/'" class="hover:text-slate-600 dark:hover:text-slate-300">{{ meta?.label || section }}</a>
        <template v-if="subcategory">
          <span>/</span>
          <span class="text-slate-500 dark:text-slate-400">{{ subcategory }}</span>
        </template>
        <span>/</span>
        <span class="text-slate-600 dark:text-slate-300">{{ frontmatter.title }}</span>
      </div>
    </div>

    <!-- doc-shell -->
    <div class="mx-auto max-w-7xl px-6 flex gap-10 w-full flex-1">
      <Sidebar :section="section" />

      <!-- Center: article -->
      <main class="py-10 min-w-0 flex-1 max-w-3xl">

        <!-- doc header -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span v-if="status && statusMeta[status]" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="statusMeta[status].class">
            <span class="w-1.5 h-1.5 rounded-full" :class="statusMeta[status].dot"></span>{{ status }}
          </span>
          <!-- 依存関係マップ（08）へ -->
          <a :href="depsHref" class="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg px-3 py-1.5" title="依存関係マップで開く">
            <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-3M8 13l8 3"/></svg>
            依存関係マップ
          </a>
        </div>
        <h1 class="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ frontmatter.title }}</h1>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <span class="text-sm text-slate-400 dark:text-slate-500">{{ meta?.label }}<template v-if="subcategory"> › {{ subcategory }}</template></span>
        </div>
        <p v-if="frontmatter.description" class="mt-3 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">{{ frontmatter.description }}</p>

        <!-- body -->
        <article class="prose-doc mt-10">
          <Content />
        </article>

        <!-- prev / next -->
        <nav v-if="prevDoc || nextDoc" class="mt-14 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
          <a v-if="prevDoc" :href="prevDoc.href" class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600">
            <div class="text-xs text-slate-400 dark:text-slate-500">← 前</div>
            <div class="font-medium text-slate-700 dark:text-slate-300 mt-1">{{ prevDoc.title }}</div>
          </a>
          <div v-else></div>
          <a v-if="nextDoc" :href="nextDoc.href" class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 text-right">
            <div class="text-xs text-slate-400 dark:text-slate-500">次 →</div>
            <div class="font-medium text-slate-700 dark:text-slate-300 mt-1">{{ nextDoc.title }}</div>
          </a>
        </nav>
      </main>

      <!-- Right: on-this-page TOC -->
      <aside v-if="headers.length" class="hidden xl:block w-56 shrink-0">
        <div class="sticky top-24 py-8">
          <p class="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-3">このページの内容</p>
          <nav>
            <a v-for="h in headers" :key="h.slug" :href="'#' + h.slug" :class="h.level === 3 ? 'toc-link sub' : 'toc-link'">{{ h.title }}</a>
          </nav>
        </div>
      </aside>
    </div>
  </div>
</template>
