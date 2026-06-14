---
title: サインアップ API
description: 新規ユーザーアカウントを作成し、認証用トークンを発行する
subcategory: 認証
method: POST
path: /signup
status: 承認済み
dependsOn:
  - api/auth/scope
  - db/schema/users
related:
  - guide/api-format
  - ui/auth/login
---

# API情報

### メソッド
POST

### パス
/signup

### 説明
新しいユーザーアカウントを作成し、認証用トークンを発行する。

## リクエスト

### ヘッダー

| 名前 | 必須 | 説明 |
| --- | --- | --- |
| Content-Type | 必須 | `application/json` |

### ボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
| --- | --- | --- | --- | --- |
| email | string | 必須 | RFC 5322 準拠 | 登録用メールアドレス。一意であること。 |
| password | string | 必須 | 8〜64 文字 | ログインパスワード。 |
| username | string | 任意 | 1〜32 文字 | 表示名。未指定時は email のローカル部が使用される。 |

### サンプル

```json
{
  "email": "alice@example.com",
  "password": "p@ssw0rd123",
  "username": "Alice"
}
```

## レスポンス

### 成功時（201 Created）

| フィールド | 型 | 説明 |
| --- | --- | --- |
| userId | string | 作成されたユーザーの一意 ID。 |
| email | string | 登録されたメールアドレス。 |
| username | string | 表示名。 |
| accessToken | string | 認証用アクセストークン。有効期限 1 時間。 |
| refreshToken | string | トークン再発行用。有効期限 14 日。 |

```json
{
  "userId": "usr_0a1b2c3d4e5f",
  "email": "alice@example.com",
  "username": "Alice",
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "rt_9z8y7x6w5v4u"
}
```

### エラー時

| ステータス | コード | 説明 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | リクエストボディの形式が不正、またはバリデーションエラー。 |
| 409 | `EMAIL_ALREADY_USED` | 指定された email は既に登録済み。 |
| 429 | `TOO_MANY_REQUESTS` | 同一 IP からのリクエストが制限値を超過。 |

```json
{
  "code": "EMAIL_ALREADY_USED",
  "message": "このメールアドレスは既に使用されています。"
}
```

## 副作用

各副作用は **内容 / 経路 / 失敗時** の3項目で記述する（対象は見出しに示す）。

### 内部状態（DB トランザクション内）

主操作（アカウント作成）と同一トランザクションで確定する。

#### users テーブル

- **内容**: レコード作成（INSERT）。パスワードは bcrypt（cost=12）でハッシュ化して保存する。
- **経路**: DB トランザクション内。
- **失敗時**: 主操作と同一トランザクションのため、失敗時はロールバックされる。

#### sessions テーブル

- **内容**: 認証トークンペア（access / refresh）を保持する。
- **経路**: DB トランザクション内。
- **失敗時**: 主操作と同一トランザクションのため、失敗時はロールバックされる。

### 外部への副作用

以降の副作用はすべて **DB トランザクションとは別経路** で行う（commit 後）。失敗してもアカウント作成自体は取り消さない（最終的整合性）。共通の失敗時の扱いは末尾にまとめる。

#### メール送信（SendGrid）

- **内容**: ウェルカムメール、およびメール認証（verify）用リンク。
- **経路**: 非同期。トランザクション commit 後にジョブキューへ積む。
- **失敗時**: 最大 3 回リトライし、それでも失敗すればデッドレターキューへ移動し運用通知を出す。未認証のまま一定期間（例: 7 日）放置されたアカウントは定期バッチで無効化する。

#### 監査ログ（CloudWatch Logs）

- **内容**: アカウント作成イベント、実行元 IP / User-Agent（PII は最小限、email はマスク）。
- **経路**: 非同期（fire-and-forget）。
- **失敗時**: コンプライアンス要件上、ローカルファイルにもフォールバック書き込みし、後続バッチで再送する。

### 共通の失敗時の扱い

- **整合性**: アカウント作成は DB トランザクションで確定済みのため、外部副作用（メール送信・監査ログ）の失敗で取り消さない。
- **主操作失敗時**: DB トランザクションが失敗した場合は即座に中断し、500 系のエラーレスポンスを返す。外部副作用は一切実行しない。
- **リトライ**: 外部副作用は非同期でリトライし、復旧不能なものは運用へ通知する。
- **冪等性**: すべての副作用は `userId` を冪等キーとして扱い、リトライや重複配送が起きても結果が重複しない設計とする。

## シナリオ（BDD / Gherkin）

上記仕様の振る舞いを `Given-When-Then` で表現したもの。Cucumber 等の実行対象ではなく、レビュー用の仕様記述として扱う。

```gherkin
Feature: ユーザーサインアップ (/signup)
  新しいユーザーがアカウントを作成し、認証トークンを取得できる。
  外部副作用の成否はアカウント作成自体の成否とは独立して扱われる。

  Background:
    Given エンドポイント "/signup" が利用可能である
    And Content-Type ヘッダーは "application/json" である

  Scenario: 有効なリクエストでサインアップに成功する
    Given email "alice@example.com" はまだ登録されていない
    When 以下のボディで POST "/signup" をリクエストする
      """
      {
        "email": "alice@example.com",
        "password": "p@ssw0rd123",
        "username": "Alice"
      }
      """
    Then ステータスコードは 201 である
    And レスポンスに userId / accessToken / refreshToken が含まれる
    And users テーブルにパスワードがハッシュ化されたレコードが作成される
    And 認証用メールが送信キューに積まれる

  Scenario: 既に登録済みの email は拒否される
    Given email "bob@example.com" は既に登録済みである
    When 以下のボディで POST "/signup" をリクエストする
      """
      { "email": "bob@example.com", "password": "p@ssw0rd123" }
      """
    Then ステータスコードは 409 である
    And エラーコードは "EMAIL_ALREADY_USED" である
    And アカウントは作成されない

  Scenario: 不正なリクエストボディは拒否される
    When 以下のボディで POST "/signup" をリクエストする
      """
      { "email": "not-an-email", "password": "short" }
      """
    Then ステータスコードは 400 である
    And エラーコードは "INVALID_REQUEST" である

  Scenario: 同一 IP からの過剰リクエストは制限される
    Given 同一 IP から直近のリクエスト数が制限値に達している
    When POST "/signup" をリクエストする
    Then ステータスコードは 429 である
    And エラーコードは "TOO_MANY_REQUESTS" である

  Scenario: メール送信に失敗してもアカウントは有効なまま残る（最終的整合性）
    Given 有効なリクエストでアカウントが作成された
    When 認証メールの送信が 3 回連続で失敗する
    Then メッセージはデッドレターキューに移動し運用へ通知される
    But アカウントは無効化されず、後続のリトライで再送が試みられる

  Scenario: メールの重複配送でもユーザーへ重複送信しない（冪等性）
    Given ジョブキューから同一の送信ジョブが複数回取り出される
    When メール送信ワーカーがそれぞれを処理する
    Then ユーザーへ届くメールは 1 通である（userId を冪等キーに重複を弾く）

  Scenario: 監査ログの送信に失敗してもローカルへフォールバック記録する
    Given アカウント作成時に CloudWatch Logs へのログ送信が失敗する
    Then 監査イベントはローカルファイルにも書き込まれる
    And 後続バッチで CloudWatch Logs へ再送される
```
