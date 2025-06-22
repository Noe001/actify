class WorkspaceMembership < ApplicationRecord
  belongs_to :user
  belongs_to :workspace

  # バリデーション
  validates :role, inclusion: { in: %w[admin department_admin member] }
  validates :status, inclusion: { in: %w[active inactive pending suspended] }
  validates :user_id, uniqueness: { scope: :workspace_id }

  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :admins, -> { where(role: 'admin', status: 'active') }
  scope :department_admins, -> { where(role: 'department_admin', status: 'active') }
  scope :members, -> { where(role: 'member', status: 'active') }

  # コールバック
  before_create :set_joined_at
  before_update :set_left_at, if: :will_save_change_to_status?

  # 権限チェックメソッド
  def admin?
    role == 'admin' && status == 'active'
  end

  def department_admin?
    role.in?(['admin', 'department_admin']) && status == 'active'
  end

  def can_manage_users?
    admin?
  end

  def can_manage_department?
    department_admin?
  end

  def can_view_analytics?
    department_admin?
  end

  # メンバーシップの活性化
  def activate!
    update!(status: 'active', joined_at: Time.current, left_at: nil)
  end

  # メンバーシップの非活性化
  def deactivate!
    update!(status: 'inactive', left_at: Time.current)
  end

  # 最終活動時間の更新
  def touch_last_activity!
    update_column(:last_activity_at, Time.current)
  end

  private

  def set_joined_at
    self.joined_at = Time.current if status == 'active' && joined_at.nil?
  end

  def set_left_at
    if status_changed? && status == 'inactive'
      self.left_at = Time.current
    elsif status_changed? && status == 'active'
      self.left_at = nil
      self.joined_at = Time.current if joined_at.nil?
    end
  end
end 
