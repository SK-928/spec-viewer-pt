---
title: 執筆ガイドライン
description: 設計書の構成・用語・レビュー基準
subcategory: 執筆
status: 承認済み
related:
  - guide/api-format
---

# 執筆ガイドライン

設計書を執筆・レビューする際の共通ルール。

## 構成

- 1文書 = 1トピック（1エンドポイント / 1画面 / 1規約）
- frontmatter に `title` `description` `subcategory` `status` `updated` を必須で記述
- 依存・関連は `dependsOn` / `related` に **title** で指定する（パスでなく）

## 用語

- 必須性は「必須」「任意」で表す（記号は使わない）
- 例外・注意は `>` blockquote で明示する

## レビュー基準

- 副作用が内部・外部ともに網羅されているか
- シナリオ（Given-When-Then）で振る舞いが表現されているか
- `dependsOn` に漏れがないか

## 関連

- [API設計フォーマット](./api-format) — API 文書の標準構成
