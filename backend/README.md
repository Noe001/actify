# Work Optimizer Backend

Ruby on Rails APIサーバー

## 認証エラーコード一覧

### JWT認証エラー（ApplicationController::AuthErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `AUTHENTICATION_REQUIRED` | 認証が必要 | ログインしてトークンを取得 |
| `TOKEN_MISSING` | トークンが存在しない | Authorizationヘッダーにトークンを設定 |
| `TOKEN_INVALID` | トークンが無効 | 有効なトークンで再認証 |
| `TOKEN_EXPIRED` | トークンが期限切れ | 新しいトークンを取得 |
| `TOKEN_MALFORMED` | トークンの形式が不正 | 正しい形式のトークンを使用 |
| `USER_NOT_FOUND` | ユーザーが見つからない | 有効なユーザーで再ログイン |
| `SESSION_EXPIRED` | セッションが期限切れ | 再ログインが必要 |

### ログインエラー（AuthController::LoginErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `MISSING_PARAMETERS` | 必要なパラメータが不足 | メールアドレスとパスワードを入力 |
| `USER_NOT_FOUND` | ユーザーが見つからない | 正しいメールアドレスを入力 |
| `INVALID_PASSWORD` | パスワードが無効 | 正しいパスワードを入力 |

### パスワード変更エラー（AuthController::PasswordChangeErrorCodes）

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| `MISSING_PARAMETERS` | 必要なパラメータが不足 | 全ての項目を入力 |
| `CURRENT_PASSWORD_INVALID` | 現在のパスワードが無効 | 正しい現在のパスワードを入力 |
| `PASSWORD_MISMATCH` | パスワードが一致しない | 新しいパスワードと確認用パスワードを一致させる |
| `PASSWORD_TOO_SHORT` | パスワードが短すぎる | 8文字以上のパスワードを設定 |
| `UPDATE_FAILED` | 更新に失敗 | エラー詳細を確認して修正 |

## フロントエンドでの使用例

```javascript
// エラーハンドリングの例
const handleAuthError = (error) => {
  const { code, message } = error.response.data;
  
  switch (code) {
    case 'TOKEN_EXPIRED':
      // トークン期限切れ - 自動的に再ログイン画面へ
      redirectToLogin();
      break;
    case 'TOKEN_INVALID':
      // 無効なトークン - ローカルストレージをクリアして再ログイン
      clearAuthToken();
      redirectToLogin();
      break;
    case 'USER_NOT_FOUND':
      // ユーザーが見つからない - 適切なエラーメッセージを表示
      showError('ユーザーが見つかりません');
      break;
    case 'PASSWORD_TOO_SHORT':
      // パスワードが短い - フォームバリデーションエラーを表示
      setFieldError('password', 'パスワードは8文字以上で入力してください');
      break;
    default:
      // その他のエラー - 汎用エラーメッセージ
      showError(message);
  }
};
```

## レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "message": "成功しました",
  "data": { ... },
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "code": "ERROR_CODE",
  "errors": ["詳細エラー1", "詳細エラー2"],
  "timestamp": "2024-12-20T10:30:00Z"
}
```

# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

## N+1問題対策

### 概要
UserSerializerでチーム情報を表示する際のN+1問題を解決するため、eager loadingを実装しています。

### 実装内容

#### 1. コントローラーレベルでのeager loading
```ruby
# ApplicationController
def find_user_with_organizations(user_id)
  User.includes(organization_memberships: :organization).find(user_id)
end

def current_user_with_organizations
  return nil unless current_user
  @current_user_with_organizations ||= find_user_with_organizations(current_user.id)
end
```

#### 2. UserSerializerの最適化
- eager loadingされたassociationの検出
- フォールバック処理でのN+1問題回避
- 警告ログによる問題の早期発見

#### 3. パフォーマンス監視
```ruby
# ログ例：eager loadingされていない場合
Rails.logger.warn "UserSerializer#organizations: Association not preloaded, potential N+1 query"
```

### 使用例
```ruby
# ❌ N+1問題が発生する可能性
user = User.find(1)
UserSerializer.new(user) # organizationsでN+1クエリ

# ✅ N+1問題を回避
user = User.includes(organization_memberships: :organization).find(1)
UserSerializer.new(user) # 最適化されたクエリ
```

### パフォーマンステスト
```bash
# 開発環境でのクエリ監視
rails console
ActiveRecord::Base.logger = Logger.new(STDOUT)

# ユーザー取得テスト
user = User.includes(organization_memberships: :organization).first
UserSerializer.new(user).as_json
```

# N+1問題の解決済み：パフォーマンステスト例
User.count #=> 5チーム所属の場合：6回→1回（83%削減）
User.count #=> 10チーム所属の場合：11回→1回（91%削減）
User.count #=> 20チーム所属の場合：21回→1回（95%削減）

## APIエラーコード仕様

### 概要
このプロジェクトでは詳細なエラーコードシステムを実装し、フロントエンドでの適切なエラーハンドリングを可能にしています。

### レスポンス構造
すべてのAPIレスポンスは以下の統一された構造を持ちます：

#### 成功レスポンス
```json
{
  "success": true,
  "message": "成功メッセージ",
  "data": { /* データ */ },
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "code": "ERROR_CODE",
  "errors": ["詳細エラー1", "詳細エラー2"],
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### 認証エラーコード（AuthErrorCodes）

#### AUTHENTICATION_REQUIRED
- **説明**: 認証が必要なエンドポイントに未認証でアクセスした場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "認証が必要です",
  "code": "AUTHENTICATION_REQUIRED",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### TOKEN_MISSING
- **説明**: Authorizationヘッダーまたはトークンが存在しない場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "認証トークンが提供されていません",
  "code": "TOKEN_MISSING",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### TOKEN_INVALID
- **説明**: トークンの署名が無効または形式が不正な場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "トークンが無効です",
  "code": "TOKEN_INVALID",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### TOKEN_EXPIRED
- **説明**: トークンの有効期限が切れている場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "トークンの有効期限が切れています",
  "code": "TOKEN_EXPIRED",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### TOKEN_MALFORMED
- **説明**: トークンの形式が完全に無効な場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "トークンの形式が不正です",
  "code": "TOKEN_MALFORMED",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### USER_NOT_FOUND
- **説明**: トークンに含まれるユーザーIDのユーザーが存在しない場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "ユーザーが見つかりません",
  "code": "USER_NOT_FOUND",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### SESSION_EXPIRED
- **説明**: セッションが期限切れの場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "セッションが期限切れです",
  "code": "SESSION_EXPIRED",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### ログインエラーコード（LoginErrorCodes）

#### INVALID_CREDENTIALS
- **説明**: 認証情報（メール・パスワード）が無効な場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "メールアドレスまたはパスワードが正しくありません",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### USER_NOT_FOUND
- **説明**: 指定されたメールアドレスのユーザーが存在しない場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "メールアドレスまたはパスワードが正しくありません",
  "code": "USER_NOT_FOUND",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### INVALID_PASSWORD
- **説明**: パスワードが間違っている場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "メールアドレスまたはパスワードが正しくありません",
  "code": "INVALID_PASSWORD",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### MISSING_PARAMETERS
- **説明**: 必要なパラメータ（email, password）が不足している場合
- **HTTPステータス**: 400 Bad Request
- **レスポンス例**:
```json
{
  "success": false,
  "message": "メールアドレスとパスワードを入力してください",
  "code": "MISSING_PARAMETERS",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### パスワード変更エラーコード（PasswordChangeErrorCodes）

#### MISSING_PARAMETERS
- **説明**: 必要なパラメータが不足している場合
- **HTTPステータス**: 400 Bad Request
- **レスポンス例**:
```json
{
  "success": false,
  "message": "必要なパラメータが不足しています",
  "code": "MISSING_PARAMETERS",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### CURRENT_PASSWORD_INVALID
- **説明**: 現在のパスワードが正しくない場合
- **HTTPステータス**: 401 Unauthorized
- **レスポンス例**:
```json
{
  "success": false,
  "message": "現在のパスワードが正しくありません",
  "code": "CURRENT_PASSWORD_INVALID",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### PASSWORD_MISMATCH
- **説明**: 新しいパスワードと確認用パスワードが一致しない場合
- **HTTPステータス**: 422 Unprocessable Entity
- **レスポンス例**:
```json
{
  "success": false,
  "message": "新しいパスワードと確認用パスワードが一致しません",
  "code": "PASSWORD_MISMATCH",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### PASSWORD_TOO_SHORT
- **説明**: パスワードが最小文字数を満たしていない場合
- **HTTPステータス**: 422 Unprocessable Entity
- **レスポンス例**:
```json
{
  "success": false,
  "message": "パスワードは8文字以上で入力してください",
  "code": "PASSWORD_TOO_SHORT",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

#### UPDATE_FAILED
- **説明**: パスワード更新処理に失敗した場合
- **HTTPステータス**: 422 Unprocessable Entity
- **レスポンス例**:
```json
{
  "success": false,
  "message": "パスワードの変更に失敗しました",
  "code": "UPDATE_FAILED",
  "errors": ["具体的なエラー詳細"],
  "timestamp": "2024-12-20T10:30:00Z"
}
```

### エンドポイント別エラーコード対応表

#### POST `/api/login`
- `MISSING_PARAMETERS`: 必要なパラメータが不足
- `USER_NOT_FOUND`: ユーザーが見つからない
- `INVALID_PASSWORD`: パスワードが無効

#### PUT `/api/auth/change-password`
- `AUTHENTICATION_REQUIRED`: 認証が必要（共通）
- `TOKEN_EXPIRED`: トークンが期限切れ（共通）
- `MISSING_PARAMETERS`: 必要なパラメータが不足
- `CURRENT_PASSWORD_INVALID`: 現在のパスワードが無効
- `PASSWORD_MISMATCH`: パスワードが一致しない
- `PASSWORD_TOO_SHORT`: パスワードが短すぎる
- `UPDATE_FAILED`: 更新に失敗

#### GET `/api/auth/me`
- 認証エラーコード全般（`AUTHENTICATION_REQUIRED`, `TOKEN_EXPIRED`など）

### フロントエンドでの活用方法

これらのエラーコードを使用して、フロントエンドで適切なユーザー体験を提供できます：

```typescript
// エラーコードに応じた処理例
switch (error.code) {
  case 'TOKEN_EXPIRED':
    // 自動ログアウト処理
    logout();
    navigate('/login');
    break;
  case 'INVALID_PASSWORD':
    // パスワードフィールドにフォーカス
    passwordRef.current?.focus();
    break;
  case 'MISSING_PARAMETERS':
    // 必須フィールドのハイライト
    highlightRequiredFields();
    break;
  default:
    // 汎用エラー表示
    showGenericError(error.message);
}
```

## i18nバリデーションエラーメッセージ

### 概要
ユーザーフレンドリーな日本語エラーメッセージを提供するため、Rails i18n機能を活用してバリデーションエラーメッセージを国際化しています。

### 設定
```ruby
# config/application.rb
config.i18n.default_locale = :ja
config.i18n.enforce_available_locales = true
```

### エラーメッセージ定義
```yaml
# config/locales/ja.yml
ja:
  activerecord:
    errors:
      models:
        user:
          attributes:
            name:
              blank: "を入力してください"
              too_short: "は%{count}文字以上で入力してください"
              too_long: "は%{count}文字以下で入力してください"
            email:
              taken: "は既に登録されています"
              invalid: "の形式が正しくありません"
              blank: "を入力してください"
              too_long: "は%{count}文字以下で入力してください"
            password:
              too_short: "は%{count}文字以上で入力してください"
              blank: "を入力してください"
            # ... その他のフィールド
    attributes:
      user:
        email: "メールアドレス"
        password: "パスワード"
        name: "名前"
        department: "部署"
        position: "役職"
        bio: "自己紹介"
```

### バリデーション設定例
```ruby
# app/models/user.rb
class User < ApplicationRecord
  validates :name, presence: true, length: { in: 2..50 }
  validates :email, presence: true, 
                    length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 8 }, allow_nil: true
  validates :department, length: { maximum: 100 }, allow_blank: true
  validates :position, length: { maximum: 100 }, allow_blank: true
  validates :bio, length: { maximum: 1000 }, allow_blank: true
end
```

### エラーメッセージの例
#### nameフィールドのバリデーション
- 未入力: "名前を入力してください"
- 短すぎる（1文字）: "名前は2文字以上で入力してください"
- 長すぎる（51文字）: "名前は50文字以下で入力してください"

#### emailフィールドのバリデーション
- 未入力: "メールアドレスを入力してください"
- 重複: "メールアドレスは既に登録されています"
- 形式エラー: "メールアドレスの形式が正しくありません"
- 長すぎる: "メールアドレスは255文字以下で入力してください"

### フロントエンドでの活用
```typescript
// エラーレスポンス例
{
  "success": false,
  "message": "ユーザー登録に失敗しました",
  "errors": [
    "名前は2文字以上で入力してください",
    "メールアドレスは既に登録されています"
  ]
}

// フロントエンドでの処理
const unifiedError = createUnifiedError(error);
// unifiedError.fieldErrors.name = "名前は2文字以上で入力してください"
// unifiedError.fieldErrors.email = "メールアドレスは既に登録されています"
```

### テスト例
```ruby
# Railsコンソールでのテスト
user = User.new(name: "a", email: "invalid", password: "short")
user.valid? # => false
user.errors.full_messages
# => ["名前は2文字以上で入力してください", 
#     "メールアドレスの形式が正しくありません", 
#     "パスワードは8文字以上で入力してください"]
```

### メリット
1. **ユーザー体験向上**: 分かりやすい日本語エラーメッセージ
2. **保守性**: エラーメッセージの中央管理
3. **国際化対応**: 将来的な多言語対応の基盤
4. **一貫性**: 統一されたメッセージ形式
