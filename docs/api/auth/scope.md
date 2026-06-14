---
title: スコープ設計
description: リソース:操作 のスコープ体系と既定付与
subcategory: 認証
status: 承認済み
related:
  - api/auth/token
---

# スコープ設計

トークンが付与する権限を `リソース:操作` 形式で表現する。

## スコープ体系

| リソース | 操作 | 例 |
|---|---|---|
| `profile` | `read` / `write` | `profile:read` |
| `order` | `read` / `write` | `order:write` |
| `payment` | `read` / `write` | `payment:read` |

## 既定付与

一般ユーザーには以下を既定で付与する。

- `profile:read`
- `order:read`
- `order:write`

管理者ロールは `:*`（全操作）を付与。
