# 01. プラグイン

VitePress は Vite 上に作られているため、**Vite プラグイン**としてビルド/開発時の処理を挟めます。

## 作ったもの

ビルド/開発サーバー起動時に `helloworld` を出力するデモプラグイン。

```ts
// .vitepress/plugins/helloworld.ts
import type { Plugin } from 'vite'

export function helloworld(): Plugin {
  return {
    name: 'vitepress-plugin-helloworld',
    buildStart() {
      console.log('helloworld')
    },
  }
}
```

config から読み込みます。

```ts
// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import { helloworld } from './plugins/helloworld'

export default defineConfig({
  vite: {
    plugins: [helloworld()],
  },
  // ...
})
```

## 動作モードの制御

`apply` オプションで dev / build のどちらで動かすかを制御します。

| 設定 | dev | build |
| --- | :---: | :---: |
| `apply: 'build'` | ❌ | ✅ |
| `apply: 'serve'` | ✅ | ❌ |
| (指定なし) | ✅ | ✅ |

> **dev でも動く理由**: Vite は dev サーバー起動時にも内部で `buildStart` を発火させます。そのため `apply` を外せば dev/build 両方で動作します。

## 出力回数に注意

VitePress は SSG として **クライアント用 + サーバー用** の 2 つのバンドルをビルドします。そのため `buildStart` は build 時に **2 回** 発火します(dev 時は 1 回)。

出力を 1 回にしたい場合は、プラグイン内でフラグを持ちます。

```ts
let logged = false
export function helloworld(): Plugin {
  return {
    name: 'vitepress-plugin-helloworld',
    buildStart() {
      if (logged) return
      console.log('helloworld')
      logged = true
    },
  }
}
```

## 落とし穴: vite の型が見つからない(ts2307)

`import type { Plugin } from 'vite'` で「モジュール 'vite' が見つかりません」と出ることがあります。

**原因**: `vite` は VitePress の依存として存在していますが、`package.json` の直接依存ではないため、pnpm が `node_modules/vite` を hoisting しません。pnpm は直接依存として宣言したパッケージしかトップレベルから import できません。

**対策**: VitePress が使う Vite と同じバージョンを devDependencies に追加します。バージョンは `pnpm why vite` で確認します。

```bash
nix develop -c pnpm why vite
# → vite@7.3.5 (vitepress が依存)

nix develop -c pnpm add -D vite@7.3.5
```

```json
"devDependencies": {
  "vite": "7.3.5",
  "vitepress": "2.0.0-alpha.17"
}
```

VitePress と同一バージョンを入れるので依存ツリーは増えません(dedup されます)。IDE のエラーは **TS Server の再起動**(`Cmd+Shift+P` → "Restart TS Server")で消えます。
