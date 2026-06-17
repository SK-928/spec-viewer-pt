// サイドバークローム（幅リサイズ + « / Ctrl+B 全体折りたたみ）。
// Sidebar.vue（セクション/doc）と DepsMap.vue（依存関係マップ）で共有。
// 設定は全ページ共通（localStorage: sv-sidebar / sv-sidebar-width）
import { ref, onMounted, onUnmounted } from 'vue'

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 224 // w-56 相当
const COLLAPSED_WIDTH = 48 // 閉じたときの細幅（展開ボタンのみ表示）
const STORAGE_KEY = 'sv-sidebar'
const WIDTH_KEY = 'sv-sidebar-width'

export function useSidebarChrome() {
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(DEFAULT_WIDTH)
  const resizing = ref(false)
  const asideRef = ref<HTMLElement | null>(null)
  let asideLeft = 0

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

  return {
    sidebarCollapsed,
    sidebarWidth,
    resizing,
    asideRef,
    toggleSidebar,
    startResize,
    COLLAPSED_WIDTH,
  }
}
