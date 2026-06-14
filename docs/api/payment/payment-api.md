---
title: 決済 API 仕様
description: 決済代行連携・冪等性・エラーハンドリング
subcategory: 決済
method: POST
path: /payments
status: レビュー中
related:
  - api/order/order-api
---

# 決済 API 仕様

決済代行と連携し、決済を実行するエンドポイント。

## エンドポイント

### メソッド
POST

### パス
/payments

## 冪等性

`Idempotency-Key` ヘッダーで冪等性を保証する。同一キーの再送は最初の結果をそのまま返す。

## リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| orderId | string | 必須 | 決済対象の注文 ID |
| method | string | 必須 | 決済手段（`card` / `bank`） |

## エラー

| ステータス | コード | 説明 |
|---|---|---|
| 400 | `INVALID_REQUEST` | ボディ不正 |
| 402 | `PAYMENT_FAILED` | 決済代行での失敗 |
| 409 | `ALREADY_PAID` | 当該注文は支払済み |
