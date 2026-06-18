import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import container from 'markdown-it-container'

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

  markdown: {
    config(md) {
      md.use(container, 'note', {
        render(tokens, idx) {
          return tokens[idx].nesting === 1
            ? '<div class="custom-block note"><p class="custom-block-title">注記</p>\n'
            : '</div>\n'
        }
      })
      md.use(container, 'card', {
        render(tokens, idx) {
          const m = tokens[idx]
          if (m.nesting === 1) {
            const title = m.info.trim().replace(/^card\b\s*/i, '').trim()
            return `<div class="custom-block card"><p class="custom-block-title">${title ? md.utils.escapeHtml(title) : 'カード'}</p>\n`
          }
          return '</div>\n'
        }
      })
    }
  },

  vite: {
    plugins: [tailwindcss()]
  }
})
