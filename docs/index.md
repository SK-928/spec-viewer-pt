# VitePress 拡張ガイド

このプロジェクトで試した VitePress の拡張手法をまとめたドキュメントです。

## 目次

| トピック | 内容 |
| --- | --- |
| [01. プラグイン](./plugins.md) | ビルド/開発時に処理を挟む Vite プラグインの作成と、型解決の落とし穴 |
| [02. コンポーネント](./components.md) | Markdown で Vue コンポーネントを使う 2 つの方法 |
| [03. ルーティングごとの適用](./routing.md) | グローバルコンポーネントを「どのページで表示するか」制御する 3 つの方法と、その表示の違い |

## 前提知識

- VitePress `2.0.0-alpha.17`(内部で Vite `7.3.5` を使用)
- パッケージマネージャは pnpm(nix flake + direnv で `nodejs_24` / `pnpm` を提供)
- コンテンツのソースディレクトリは `srcDir: "md"`(`md/` 配下がサイトになる)

## コマンド

```bash
# nix 環境内で実行する
nix develop -c pnpm spec:dev     # 開発サーバー
nix develop -c pnpm spec:build   # ビルド
nix develop -c pnpm spec:preview # ビルド結果のプレビュー
```

## 関連ディレクトリ

```
.vitepress/
├─ config.mts                     サイト設定
├─ plugins/                       Vite プラグイン
└─ theme/
   ├─ index.ts                    テーマ設定・グローバル登録
   ├─ Layout.vue                  デフォルト Layout のラッパー
   └─ components/                 グローバルコンポーネント / カスタムレイアウト
md/                               サイトのソース(srcDir)
docs/                             本ドキュメント(VitePress のビルド対象外)
```
