class TeamMembership < ApplicationRecord
  # リレーションシップ
  belongs_to :team
  belongs_to :user

  # バリデーション
  validates :role, inclusion: { in: %w[leader member] }
  validates :status, inclusion: { in: %w[active inactive] }
  validates :user_id, uniqueness: { scope: :team_id }

  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :leaders, -> { where(role: 'leader', status: 'active') }
  scope :members, -> { where(role: 'member', status: 'active') }

  # コールバック
  before_create :set_joined_at
  before_update :set_left_at, if: :will_save_change_to_status?
  after_create :update_team_member_count
  after_update :update_team_member_count, if: :saved_change_to_status?
  after_destroy :update_team_member_count

  # 権限チェックメソッド
  def leader?
    role == 'leader' && status == 'active'
  end

  def can_manage_team?
    leader?
  end

  # メンバーシップの活性化
  def activate!
    update!(status: 'active', joined_at: Time.current, left_at: nil)
  end

  # メンバーシップの非活性化
  def deactivate!
    update!(status: 'inactive', left_at: Time.current)
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

  def update_team_member_count
    team&.update_member_count
  end
end 
