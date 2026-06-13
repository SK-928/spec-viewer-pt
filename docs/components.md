# 02. コンポーネント

Markdown ファイルは Vue SFC として処理されるため、Vue コンポーネントを直接使えます。使い方は大きく **2 つ** あります。

| 方法 | 用途 | import |
| --- | --- | --- |
| **ローカル import** | 特定ページ限定 | 各 `.md` で必要 |
| **グローバル登録** | 全ページ共通 | 不要 |

## 方法1: ローカル import

特定のページだけで使うコンポーネントは、Markdown 内の `<script setup>` で import します。コンポーネントは Markdown と同じ階層に置くのが一般的です。

```vue
<!-- md/spec/api/InfoCard.vue -->
<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="info-card">
    <p v-if="title" class="title">{{ title }}</p>
    <div class="body"><slot /></div>
  </div>
</template>
```

```markdown
# ページ本文

<script setup>
import InfoCard from './InfoCard.vue'
</script>

<InfoCard title="ローカルコンポーネント">
  このカードは Markdown から直接 import しています。
</InfoCard>
```

Markdown 内の `<script setup>` は Vue SFC として処理されるため、`defineProps` や `ref` などの Composition API もそのまま使えます。

## 方法2: グローバル登録

複数ページで共通して使うコンポーネントは、テーマでグローバル登録すると import なしでどこでも使えます。

```vue
<!-- .vitepress/theme/components/MyButton.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{ type?: 'default' | 'brand' }>(),
  { type: 'default' },
)
</script>

<template>
  <button class="my-btn" :class="type">
    <slot />
  </button>
</template>
```

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MyButton from './components/MyButton.vue'

export default {
  // デフォルトテーマを維持したまま拡張する
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MyButton', MyButton)
  },
} satisfies Theme
```

```markdown
<!-- どのページでも import 不要 -->
<MyButton>デフォルト</MyButton>
<MyButton type="brand">ブランド色</MyButton>
```

> **重要**: `theme/` ディレクトリを作ると VitePress のデフォルトテーマが外れてしまうため、`extends: DefaultTheme` でデフォルトテーマを維持します。これを忘れるとスタイルやサイドバー等が消えます。

## ファイル構成

```
.vitepress/theme/
├─ index.ts                       テーマ設定・グローバル登録
└─ components/
   └─ MyButton.vue                グローバルコンポーネント(慣例の場所)

md/spec/api/
├─ example.md                     ページ
└─ InfoCard.vue                   ローカルコンポーネント(ページと同階層)
```
