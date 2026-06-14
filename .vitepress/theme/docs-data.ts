// ホーム・セクション一覧・doc・依存関係マップ・検索で共有するデータ層。
// docs/*.md を import.meta.glob で走査し、各 frontmatter から動的に生成（実データ駆動）。
// 文書を増やすには docs/{api,ui,guide}/.../*.md を追加するだけ（このファイルは触らない）。
// dependsOn/related は docs/ からの相対 path（.md 無し）で指定する

export type SectionKey = 'api' | 'ui' | 'guide' | 'db'
export type DocStatus = '承認済み' | 'レビュー中' | 'ドラフト'

export interface SpecDoc {
  section: SectionKey
  subcategory: string
  title: string
  method?: string
  description: string
  status: DocStatus
  updated: string
  href: string
  path: string // docs/ からの相対（.md 無し）。例: api/auth/scope
  dependsOn?: string[] // 依存先文書の path（A が B に依存）
  related?: string[] // 関連文書の path
}

export interface SectionMeta {
  key: SectionKey
  label: string
  description: string
  shortDescription: string
  navHref: string
  iconClass: string
  badgeClass: string
  badgeText: string
  accentText: string
}

// セクションメタ（DESIGN.md §3）。クラス文字列は完全な形で持つ（Tailwind v4 スキャン対象）
export const sections: SectionMeta[] = [
  {
    key: 'api',
    label: 'API',
    description: 'エンドポイント・スキーマ・契約に関する設計書',
    shortDescription: 'エンドポイント・スキーマ・契約',
    navHref: '/api/',
    iconClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    badgeClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    badgeText: 'API',
    accentText: 'text-brand-600 dark:text-brand-400',
  },
  {
    key: 'ui',
    label: '画面',
    description: '画面設計・UI仕様・画面遷移に関する設計書',
    shortDescription: '画面設計・UI仕様・画面遷移',
    navHref: '/ui/',
    iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    badgeClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    badgeText: '画',
    accentText: 'text-sky-600 dark:text-sky-400',
  },
  {
    key: 'guide',
    label: 'ガイド',
    description: '執筆ガイドライン・テンプレート・規約',
    shortDescription: '執筆ガイドライン・テンプレート・規約',
    navHref: '/guide/',
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    badgeText: 'G',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'db',
    label: 'DB',
    description: 'スキーマ・テーブル・インデックス・移行に関する設計書',
    shortDescription: 'スキーマ・テーブル・インデックス',
    navHref: '/db/',
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    badgeClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    badgeText: 'DB',
    accentText: 'text-violet-600 dark:text-violet-400',
  },
]

// ステータス → バッジクラス（DESIGN.md §4 / §12）
export const statusMeta: Record<DocStatus, { class: string; dot: string }> = {
  '承認済み': {
    class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'レビュー中': {
    class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  'ドラフト': {
    class: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

// VitePress の Markdown モジュールが持つページデータ
interface MarkdownModule {
  __pageData: {
    relativePath: string
    title: string
    description: string
    frontmatter: Record<string, unknown>
    lastUpdated?: number // git の最終コミット日時（ミリ秒）。config の lastUpdated: true で設定
  }
}

// docs/**/*.md をビルド時に走査（eager = 同期、全件取得）
const modules = import.meta.glob<MarkdownModule>('../../docs/**/*.md', { eager: true })

// path の第1階層を section として導出。sections に存在するキーかで判定（大カテゴリ追加時に追記不要）
function deriveSection(path: string): SectionKey | '' {
  // '../../docs/api/auth/signup.md' → parts[3] = 'api'
  const seg = path.split('/')[3] as SectionKey
  return sections.some((s) => s.key === seg) ? seg : ''
}

// '../../docs/api/auth/signup.md' → 'api/auth/signup'
function toDocPath(path: string): string {
  return path.replace(/^(\.\.\/)+docs\//, '').replace(/\.md$/, '').replace(/\/index$/, '/')
}

// 日付値を YYYY-MM-DD に正規化。YAML 日付(Date)・lastUpdated(数値ミリ秒)・文字列に対応
// toISOString（UTC）だと JST のコミット日が前日になるため、ローカル日付で組み立てる
function normalizeDate(v: unknown): string {
  if (!v) return ''
  const d = v instanceof Date ? v : typeof v === 'number' ? new Date(v) : null
  if (d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const s = String(v)
  return s.length >= 10 ? s.slice(0, 10) : s
}

export const docs: SpecDoc[] = Object.entries(modules)
  .map(([path, mod]) => ({ path, mod, section: deriveSection(path) }))
  .filter((e): e is { path: string; mod: MarkdownModule; section: SectionKey } => {
    const parts = e.path.split('/')
    // docs/section/(subcategory/)title.md を文書とする。index.md と直下を除外。section が空でない
    return parts.length >= 5 && !e.path.endsWith('index.md') && e.section !== ''
  })
  .map(({ path, mod, section }): SpecDoc => {
    const fm = mod.__pageData.frontmatter
    const docPath = toDocPath(path)
    return {
      section,
      subcategory: String(fm.subcategory ?? ''),
      title: String(fm.title ?? mod.__pageData.title),
      description: String(fm.description ?? mod.__pageData.description ?? ''),
      status: (fm.status as DocStatus) ?? 'ドラフト',
      // git の最終コミット日時を優先。未コミット等で取れない場合は frontmatter の updated にフォールバック
      updated: normalizeDate(mod.__pageData.lastUpdated ?? fm.updated),
      href: '/' + docPath,
      path: docPath,
      method: fm.method ? String(fm.method) : undefined,
      dependsOn: Array.isArray(fm.dependsOn) ? (fm.dependsOn as string[]) : undefined,
      related: Array.isArray(fm.related) ? (fm.related as string[]) : undefined,
    }
  })
  .sort((a, b) => (b.updated || '').localeCompare(a.updated || '')) // updated 降順（YYYY-MM-DD 文字列比較）

export function sectionMeta(key: string): SectionMeta | undefined {
  return sections.find((s) => s.key === key)
}

export function docByTitle(title: string): SpecDoc | undefined {
  return docs.find((d) => d.title === title)
}

export function docByPath(path: string): SpecDoc | undefined {
  return docs.find((d) => d.path === path)
}

export function docsBySection(section: string): SpecDoc[] {
  return docs.filter((d) => d.section === section)
}

// この文書に依存している文書（被依存＝影響先）。引数は path
export function dependentsOf(path: string): SpecDoc[] {
  return docs.filter((d) => d.dependsOn?.includes(path))
}

// サブカテゴリ → 文書 のグループ化（サイドバーツリー用）
export function subcategoriesOf(section: string): { name: string; docs: SpecDoc[] }[] {
  const groups: { name: string; docs: SpecDoc[] }[] = []
  for (const d of docsBySection(section)) {
    let g = groups.find((x) => x.name === d.subcategory)
    if (!g) { g = { name: d.subcategory, docs: [] }; groups.push(g) }
    g.docs.push(d)
  }
  return groups
}

// ホームの「最近の更新」: 全文書を新しい順に上位 N 件
export function recentDocs(limit = 5): SpecDoc[] {
  return docs.slice(0, limit)
}
