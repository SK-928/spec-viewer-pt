// サイドバーの折たたみ状態・active 判定を Sidebar.vue → SidebarTree.vue へ共有する文脈。
// <script setup> 内で export できないため InjectionKey は独立モジュールに置く。
import { type InjectionKey } from 'vue'

export interface SidebarCtx {
  isExpanded: (path: string) => boolean
  toggleCat: (path: string) => void
  isActive: (href: string) => boolean
}

export const SIDEBAR_CTX: InjectionKey<SidebarCtx> = Symbol('sidebar-ctx')
