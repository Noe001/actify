class TeamGoalUpdate < ApplicationRecord
  before_create :set_uuid
  after_initialize :set_defaults

  belongs_to :team_goal
  belongs_to :updated_by, class_name: 'User'

  validates :update_type, presence: true, inclusion: { in: %w[progress status target notes] }

  # 更新タイプの定数
  UPDATE_TYPES = %w[progress status target notes].freeze

  # スコープ
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(update_type: type) }
  scope :by_user, ->(user) { where(updated_by: user) }

  # 更新履歴の要約
  def summary
    case update_type
    when 'progress'
      if old_value && new_value
        "進捗を#{old_value}%から#{new_value}%に更新"
      else
        "進捗を更新"
      end
    when 'status'
      "ステータスを「#{old_status}」から「#{new_status}」に変更"
    when 'target'
      if old_value && new_value
        "目標値を#{old_value}から#{new_value}に変更"
      else
        "目標値を変更"
      end
    when 'notes'
      "メモを更新"
    else
      "更新"
    end
  end

  # 更新の詳細情報（API用）
  def detailed_info
    {
      id: id,
      update_type: update_type,
      summary: summary,
      old_value: old_value,
      new_value: new_value,
      old_status: old_status,
      new_status: new_status,
      notes: notes,
      changes: changes,
      updated_by: {
        id: updated_by.id,
        name: updated_by.name,
        avatar_url: updated_by.avatarUrl
      },
      created_at: created_at
    }
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def set_defaults
    self.changes ||= {}
  end
end 
 