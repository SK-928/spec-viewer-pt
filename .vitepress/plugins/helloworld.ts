import type { Plugin } from 'vite'

/**
 * ビルド/開発サーバー起動時に "helloworld" を出力するデモ用プラグイン。
 * `apply` を指定しないことで dev / build 両方で動作する。
 */
export function helloworld(): Plugin {
  return {
    name: 'vitepress-plugin-helloworld',
    buildStart() {
      console.log('helloworld')
    },
  }
}
