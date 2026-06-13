import { defineConfig } from 'vitepress'
import { helloworld } from './plugins/helloworld'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "md",

  vite: {
    plugins: [helloworld()],
  },

  title: "SpecViewer",
  description: "設計書を閲覧するためのサイトです",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
