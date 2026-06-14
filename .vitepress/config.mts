import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",

  title: "SpecViewer",
  description: "設計書を閲覧するためのサイトです",

  // ダークモード: OS 設定を既定にしつつ手動切替可（localStorage 保存・フラッシュ防止 inline script 付き）
  appearance: true,

  // 各ページの最終更新日時を git の最終コミット日時から取得
  lastUpdated: true,

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    }]
  ],

  vite: {
    plugins: [tailwindcss()]
  }
})
