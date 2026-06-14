---
title: orders テーブル
description: 注文ヘッダを格納するテーブル
subcategory: スキーマ
status: レビュー中
dependsOn:
  - db/schema/users
related:
  - api/order/order-api
---

# orders テーブル

注文ヘッダを格納する。注文明細は別テーブル（order_items）。

## カラム

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | 注文 ID |
| user_id | uuid | FK → users.id, NOT NULL | 注文者 |
| status | varchar(16) | NOT NULL | `pending` / `paid` / `shipped` / `canceled` |
| total | integer | NOT NULL | 合計金額（税込・円） |
| created_at | timestamp | NOT NULL | 作成日時 |

## インデックス

- `orders_user_id_index` — ユーザー別一覧
- `orders_status_index` — 状態別集計

## 関連

- [注文 API 仕様](../../api/order/order-api) — レコード作成元
