# 03. グローバルコンポーネントをルーティングごとに適用

グローバル登録(`app.component`)は「全ページで使える」ことを意味します。「**どのルートで表示するか**」を制御するには、テーマの `Layout` をラップして `useRoute()` / `useData()` で分岐させるのが VitePress の定番パターンです。

方法は 3 つあります。

| アプローチ | 材料は何か | 誰が判断するか |
| --- | --- | --- |
| **① パスベース** | URL(`/spec/...`) | コンポーネントが **自動** で判断 |
| **② frontmatter** | ページのメタデータ | ページ作者が **手動** で宣言 |
| **③ layout プロパティ** | レイアウト名 | 作者が選ぶ(ページの **骨組みごと** 変わる) |

## 表示の違いがわかりにくい理由

①と②は「同じバナーコンポーネントが出るか出ないか」だけで、**出た時の見た目は同じ**です。違うのは「出す/出さないを何で決めるか」だけです。**本当に表示が変わるのは ③ だけ**(バナーではなくページの骨組み自体を交換するため)です。

## 方法① パスベース

URL(パス)で自動判断します。`/spec/` 配下のページにだけバナーを表示する例。

```vue
<!-- .vitepress/theme/components/SpecBanner.vue -->
<script setup lang="ts">
import { useRoute } from 'vitepress'
import { computed } from 'vue'

const route = useRoute()
const visible = computed(() => route.path.startsWith('/spec/'))
</script>

<template>
  <div v-if="visible" class="spec-banner">
    このページは spec 配下のルートです
  </div>
</template>
```

`Layout` をラップして `#layout-top` スロットに差し込みます。

```vue
<!-- .vitepress/theme/Layout.vue -->
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SpecBanner from './components/SpecBanner.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <SpecBanner />
    </template>
  </Layout>
</template>
```

```ts
// .vitepress/theme/index.ts
export default {
  extends: DefaultTheme,
  Layout,  // デフォルト Layout を自前ラッパーで上書き
  enhanceApp({ app }) { /* ... */ },
} satisfies Theme
```

`useRoute` は SSG でもビルド時にパスが確定するため、静的 HTML に正しく反映されます。

## 方法② frontmatter

各ページの frontmatter にフラグを立てて制御します。

```markdown
---
showBanner: true
---
```

```vue
<script setup lang="ts">
import { useData } from 'vitepress'
const { frontmatter } = useData()
</script>
<template>
  <div v-if="frontmatter.showBanner" class="spec-banner">...</div>
</template>
```

## 方法③ layout プロパティ(表示がガラッと変わる)

frontmatter の `layout:` でページごとにレイアウトを切り替えます。サイドバーやナビを含む **ページの骨組み自体** を交換します。

```vue
<!-- .vitepress/theme/components/SpecLayout.vue -->
<script setup lang="ts">
import { Content } from 'vitepress'  // ページ本文を差し込む
</script>

<template>
  <div class="spec-layout">
    <header class="spec-header">LAYOUT: SpecLayout 適用中</header>
    <main class="spec-main">
      <Content />
    </main>
  </div>
</template>
```

### ⚠️ 外枠を完全に消すには Layout.vue の分岐が必要

VitePress 標準の frontmatter `layout:` だけでは、外枠(ナビ・サイドバー)が **維持** され、本文エリアだけが差し替わります。外枠ごと完全に切り替えるには、`Layout.vue` 側で frontmatter を見て分岐させます。

```vue
<!-- .vitepress/theme/Layout.vue -->
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import SpecBanner from './components/SpecBanner.vue'
import SpecLayout from './components/SpecLayout.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <!-- frontmatter で SpecLayout 指定時は、外枠ごと完全に差し替え -->
  <SpecLayout v-if="frontmatter.layout === 'SpecLayout'" />

  <!-- それ以外はデフォルト Layout をラップ -->
  <Layout v-else>
    <template #layout-top>
      <SpecBanner />
    </template>
  </Layout>
</template>
```

```markdown
<!-- md/spec/api/example-layout.md -->
---
layout: SpecLayout
---

# ページ本文
```

## 表示の比較

**通常レイアウト**(`example.md`)— ナビ・サイドバーあり

```
┌──────────────────────────────┐
│ Nav                    GH ▼   │ ← ナビ
├───────┬──────────────────────┤
│       │ バナー                │ ← SpecBanner(/spec 配下なら表示)
│ Exam. ├──────────────────────┤
│ サイド │                      │
│ バー  │  ページ本文             │
└───────┴──────────────────────┘
```

**SpecLayout**(`example-layout.md`)— ナビ・サイドバーなし

```
┌──────────────────────────────┐
│ LAYOUT: SpecLayout 適用中     │ ← 色付きヘッダー(ナビなし)
├──────────────────────────────┤
│                              │
│      ページ本文(中央寄せ)      │
│      (サイドバーなし)          │
│                              │
└──────────────────────────────┘
```

## ざっくり使い分け

- **① パス**: 「このディレクトリ配下は全部これ」→ 一括で楽したい時。新ページを置けば自動で適用される。
- **② frontmatter**: 「このページだけ特別」→ 細かく個別制御したい時。フラグの書き忘れに注意。
- **③ layout**: 「ページの形そのものを変えたい」→ 縦長ランディングページなど特殊構成にする時。表示が劇的に変わるのはこれだけ。
