class Manual < ApplicationRecord
  before_create :set_uuid
  belongs_to :user
  belongs_to :workspace, optional: true

  # 状態を定義（文字列ベースのenum）
  enum status: {
    draft: 'draft',
    published: 'published'
  }

  # 部門を定義（文字列ベースのenum）
  enum department: {
    sales: 'sales',
    dev: 'dev',
    hr: 'hr'
  }

  # カテゴリーを定義（文字列ベースのenum）
  enum category: {
    procedure: 'procedure',
    rules: 'rules',
    system: 'system'
  }

  # アクセスレベルを定義（文字列ベースのenum）
  enum access_level: {
    all: 'all',
    department: 'department',
    specific: 'specific'
  }, _prefix: 'access'

  # 編集権限を定義（文字列ベースのenum）
  enum edit_permission: {
    author: 'author',
    department: 'department',
    specific: 'specific'
  }, _prefix: 'edit'

  # バリデーション
  validates :title, presence: true
  validates :department, presence: true
  validates :category, presence: true
  validates :access_level, presence: true
  validates :edit_permission, presence: true
  validates :status, presence: true

  # デフォルトのスコープとして公開中のマニュアルを取得
  scope :published, -> { where(manuals: { status: 'published' }) }
  
  # 特定のユーザーがアクセスできるマニュアルを取得するスコープ
  # TODO: access_level = 'specific' の実装は仮実装です
  # 将来的にmanual_accessesテーブルを使用した詳細な権限管理に移行予定
  scope :accessible_by, ->(user) {
    if user.nil?
      none
    else
      where(
        '(manuals.user_id = ?) OR (manuals.status = ? AND (manuals.access_level = ? OR (manuals.access_level = ? AND manuals.department = ?) OR (manuals.access_level = ? AND manuals.user_id = ?)))',
        user.id,  # 自分が作成したマニュアル（下書き含む）
        'published',  # 公開済みマニュアルの場合
        'all',  # 全社員アクセス可能
        'department', user.department.to_s,  # 同じ部門
        'specific', user.id  # 仮実装：作成者のみアクセス可能（本来は指定ユーザー）
      )
    end
  }
  
  # アクセスレベルの警告メッセージ（開発環境用）
  def access_level_warning?
    access_specific? && Rails.env.development?
  end

  def access_level_warning_message
    "⚠️ 注意: 'specific'アクセスレベルは現在仮実装のため、作成者のみアクセス可能です。将来的にmanual_accessesテーブルを使用した指定メンバー機能を実装予定です。"
  end

  private

  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end
