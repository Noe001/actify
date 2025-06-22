class Task < ApplicationRecord
  before_create :set_uuid
  
  belongs_to :user, foreign_key: 'assigned_to', optional: true
  belongs_to :organization, optional: true
  belongs_to :workspace, optional: true
  belongs_to :team, optional: true
  
  # ActiveStorage関連
  has_many_attached :attachments
  
  # サブタスク関係の追加
  belongs_to :parent_task, class_name: 'Task', foreign_key: 'parent_task_id', optional: true
  has_many :subtasks, class_name: 'Task', foreign_key: 'parent_task_id', dependent: :destroy
  accepts_nested_attributes_for :subtasks, allow_destroy: true, reject_if: :all_blank

  # ステータスと優先度の定数
  STATUSES = ['pending', 'in_progress', 'review', 'completed'].freeze
  PRIORITIES = ['low', 'medium', 'high', 'urgent'].freeze

  # バリデーション
  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }, allow_nil: true
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
  
  # タグの取得と設定
  def tag_list
    tags.present? ? tags.split(',') : []
  end

  def tag_list=(tags_array)
    self.tags = tags_array.join(',')
  end

  # スコープ
  scope :pending, -> { where(status: 'pending') }
  scope :in_progress, -> { where(status: 'in_progress') }
  scope :completed, -> { where(status: 'completed') }
  scope :high_priority, -> { where(priority: 'high') }
  scope :due_soon, -> { where('due_date <= ? AND due_date >= ?', 7.days.from_now, Date.current) }
  scope :overdue, -> { where('due_date < ? AND status != ?', Date.current, 'completed') }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_organization, ->(organization_id) { where(organization_id: organization_id) }
  scope :for_team, ->(team_id) { where(team_id: team_id) }
  scope :team_tasks, -> { where.not(team_id: nil) }
  scope :not_completed, -> { where.not(status: 'completed') }
  scope :parent_tasks, -> { where(parent_task_id: nil) }  # 親タスクのみ取得するスコープ
  
  # 自分のタスク
  def self.for_user(user_id)
    where(assigned_to: user_id)
  end
  
  # タスクを完了としてマークする
  def complete!
    update(status: 'completed')
  end
  
  # タスクが完了しているかチェック
  def completed?
    status == 'completed'
  end
  
  # タスクが期限切れかチェック
  def overdue?
    due_date.present? && due_date < Date.current && !completed?
  end
  
  # サブタスクがあるかチェック
  def has_subtasks?
    subtasks.exists?
  end
  
  # サブタスクの完了率を計算
  def subtasks_completion_rate
    return 0 if subtasks.empty?
    completed_count = subtasks.where(status: 'completed').count
    (completed_count.to_f / subtasks.count * 100).round
  end
  
  # チームタスクかどうか
  def team_task?
    team_id.present?
  end
  
  # チームにタスクを割り当て
  def assign_to_team(team, assigned_by = nil)
    update!(team: team)
    
    # チームメンバーに限定されている場合のバリデーション
    if assigned_to.present? && !team.member?(user)
      errors.add(:assigned_to, 'はチームメンバーである必要があります')
      return false
    end
    
    # 活動ログを記録
    if assigned_by && team
      TeamActivity.log_task_assigned(team, assigned_by, self, user) if user
    end
    
    true
  end
  
  # チームタスクの完了時の処理
  def complete_team_task!(completed_by = nil)
    return false unless team_task?
    
    update!(status: 'completed')
    
    # 活動ログを記録
    if completed_by && team
      TeamActivity.log_task_completed(team, completed_by, self)
    end
    
    true
  end
  
  private
  
  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end 
