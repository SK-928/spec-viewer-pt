---
title: 注文状態遷移
description: 注文ステータスの遷移ルールとイベント
subcategory: 注文
status: ドラフト
dependsOn:
  - api/order/order-api
---

# 注文状態遷移

注文ステータスの遷移ルールと、各遷移で発生するイベントを定義する。

## ステータス

| ステータス | 説明 |
|---|---|
| `pending` | 注文受領・決済待ち |
| `paid` | 決済完了 |
| `shipped` | 出荷済み |
| `canceled` | キャンセル |

## 遷移

- `pending` → `paid`（決済完了）
- `pending` → `canceled`（キャンセル）
- `paid` → `shipped`（出荷）
- `paid` → `canceled`（返金前提のキャンセルのみ）

> 不正な遷移は `409 CONFLICT` で拒否する。

## 関連

- [注文 API 仕様](./order-api) — 注文の作成
