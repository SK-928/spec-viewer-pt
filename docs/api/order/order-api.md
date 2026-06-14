---
title: 注文 API 仕様
description: エンドポイント・リクエスト・レスポンス形式
subcategory: 注文
method: POST
path: /orders
status: 承認済み
dependsOn:
  - api/payment/payment-api
related:
  - api/order/order-state
---

# 注文 API 仕様

注文を作成し、決済に進むためのエンドポイント。

## エンドポイント

### メソッド
POST

### パス
/orders

## リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| items | array | 必須 | 注文商品（`{ sku, quantity }`）の配列 |
| paymentMethod | string | 必須 | 決済手段（`card` / `bank`） |

## レスポンス（201 Created）

| フィールド | 型 | 説明 |
|---|---|---|
| orderId | string | 注文 ID |
| status | string | 注文状態（`pending`） |
| total | number | 合計金額 |

## 関連

- [決済 API 仕様](../payment/payment-api) — 注文後に呼ぶ決済
- [注文状態遷移](./order-state) — 注文の状態機械
