---
title: users テーブル
description: ユーザーアカウントを格納するテーブル
subcategory: スキーマ
status: 承認済み
related:
  - api/auth/signup
---

# users テーブル

ユーザーアカウントを格納する。サインアップ時にレコードが作成される。

## カラム

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | ユーザー ID |
| email | varchar(255) | UNIQUE, NOT NULL | ログイン email |
| password_hash | varchar(255) | NOT NULL | bcrypt（cost=12）でハッシュ化 |
| username | varchar(32) | | 表示名。未指定時は email ローカル部 |
| created_at | timestamp | NOT NULL | 作成日時 |

## インデックス

- `users_email_unique` — email の一意制約（検索も兼用）
- `users_created_at_index` — 一覧のソート用

## 関連

- [サインアップ API](../../api/auth/signup) — レコード作成元
