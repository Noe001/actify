# 権限管理システム移行計画

## 🚨 現在の問題

### セキュリティリスク
- 文字列検索による権限判定（`position.include?('manager')`）
- 意図しない権限昇格の可能性
- 役職名変更時の脆弱性

### 具体的な問題例
```ruby
# 危険な例
position = "Project Manager Assistant"  # 管理者ではないが
position.include?('manager')  # => true（誤判定）

position = "マネージャー補佐"  # 管理者ではないが  
position.include?('マネージャー')  # => true（誤判定）
```

## 📋 段階的移行プラン

### Phase 1: 暫定的安全性向上 ✅ **完了**
- ホワイトリスト方式への変更
- 厳格な完全一致チェック
- セキュリティ警告の追加

### Phase 2: データベーススキーマ拡張 🔄 **実装中**

#### 2.1 権限フラグの追加
```ruby
# Migration
class AddAuthorizationFieldsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :department_admin, :boolean, default: false
    add_column :users, :system_admin, :boolean, default: false
    add_column :users, :organization_admin, :boolean, default: false
    
    add_index :users, :department_admin
    add_index :users, :system_admin
  end
end
```

#### 2.2 Role Enumの追加
```ruby
# User model
enum role: {
  member: 'member',
  department_admin: 'department_admin', 
  system_admin: 'system_admin',
  organization_admin: 'organization_admin'
}
```

### Phase 3: RBAC システム実装 📅 **計画中**

#### 3.1 Permissionテーブル設計
```ruby
class Permission < ApplicationRecord
  belongs_to :user
  belongs_to :resource, polymorphic: true
  
  validates :action, presence: true
  validates :scope, presence: true
  
  enum action: {
    read: 'read',
    write: 'write', 
    delete: 'delete',
    admin: 'admin'
  }
  
  enum scope: {
    own: 'own',           # 自分のリソースのみ
    department: 'department', # 同じ部門
    organization: 'organization', # チーム全体
    system: 'system'      # システム全体
  }
end
```

#### 3.2 新しい権限チェックメソッド
```ruby
class User < ApplicationRecord
  def can?(action, resource, scope = :own)
    return true if system_admin?
    
    permissions.exists?(
      action: action,
      resource_type: resource.class.name,
      scope: scope
    )
  end
  
  def department_admin?
    department_admin || 
    can?(:admin, Manual, :department) ||
    role == 'department_admin'
  end
end
```

### Phase 4: CanCanCan統合 📅 **将来計画**

#### 4.1 Ability定義
```ruby
class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user
    
    if user.system_admin?
      can :manage, :all
    elsif user.department_admin?
      can :manage, Manual, department: user.department
      can :read, Manual, status: 'published'
    else
      can :read, Manual, status: 'published'
      can :manage, Manual, user: user
    end
  end
end
```

## 🔧 実装スケジュール

| Phase | 期間 | 責任者 | 状態 |
|-------|------|--------|------|
| Phase 1 | 即座 | 開発チーム | ✅ 完了 |
| Phase 2 | 1-2週間 | バックエンド | 🔄 実装中 |
| Phase 3 | 2-3週間 | フルスタック | 📅 計画中 |
| Phase 4 | 1週間 | バックエンド | 📅 将来計画 |

## ⚠️ 移行時の注意事項

### データ移行
- 既存ユーザーの権限を適切にマッピング
- ロールバック戦略の準備
- 段階的デプロイメント

### テスト戦略
- 権限境界値テスト
- セキュリティテストの実装
- 既存機能の回帰テスト

### コミュニケーション
- チーム内での権限仕様の共有
- ドキュメント更新
- ユーザー影響の事前告知

## 🛡️ セキュリティベストプラクティス

1. **最小権限の原則**: 必要最小限の権限のみ付与
2. **明示的な拒否**: デフォルトは権限なし
3. **定期的な権限監査**: 不要な権限の定期削除
4. **ログ記録**: 権限変更の完全なログ
5. **テスト自動化**: 権限ロジックの継続的テスト

## 📚 参考資料

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [CanCanCan Documentation](https://github.com/CanCanCommunity/cancancan)
- [Pundit Gem](https://github.com/varvet/pundit) 
