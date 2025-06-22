class TeamGoal < ApplicationRecord
  before_create :set_uuid
  after_initialize :set_defaults
  before_update :track_changes

  belongs_to :team
  belongs_to :created_by, class_name: 'User'
  belongs_to :last_updated_by, class_name: 'User', optional: true
  has_many :team_goal_updates, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }
  validates :description, length: { maximum: 1000 }
  validates :goal_type, inclusion: { in: %w[objective kpi milestone] }
  validates :category, inclusion: { in: %w[performance growth quality innovation] }
  validates :priority, inclusion: { in: %w[low medium high critical] }
  validates :status, inclusion: { in: %w[planning active completed cancelled paused] }
  validates :start_date, :target_date, presence: true
  validates :target_date, comparison: { greater_than: :start_date }
  validates :progress_percentage, numericality: { 
    greater_than_or_equal_to: 0, 
    less_than_or_equal_to: 100 
  }
  
  # KPIの場合は数値目標が必要
  validates :target_value, presence: true, if: -> { goal_type == 'kpi' }
  validates :unit, presence: true, if: -> { goal_type == 'kpi' }

  # 定数
  GOAL_TYPES = %w[objective kpi milestone].freeze
  CATEGORIES = %w[performance growth quality innovation].freeze
  PRIORITIES = %w[low medium high critical].freeze
  STATUSES = %w[planning active completed cancelled paused].freeze

  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :completed, -> { where(status: 'completed') }
  scope :archived, -> { where(is_archived: true) }
  scope :not_archived, -> { where(is_archived: false) }
  scope :by_type, ->(type) { where(goal_type: type) }
  scope :by_category, ->(category) { where(category: category) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('target_date < ? AND status NOT IN (?)', Date.current, %w[completed cancelled]) }
  scope :due_soon, -> { where('target_date BETWEEN ? AND ? AND status = ?', Date.current, 7.days.from_now, 'active') }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_progress, ->(min_progress, max_progress = 100) { where(progress_percentage: min_progress..max_progress) }

  # チームの目標統計
  def self.team_stats(team)
    goals = team.team_goals.not_archived
    
    {
      total: goals.count,
      active: goals.active.count,
      completed: goals.completed.count,
      overdue: goals.overdue.count,
      due_soon: goals.due_soon.count,
      completion_rate: calculate_completion_rate(goals),
      average_progress: calculate_average_progress(goals.active),
      by_category: goals.group(:category).count,
      by_priority: goals.group(:priority).count,
      by_type: goals.group(:goal_type).count
    }
  end

  # 進捗を更新
  def update_progress(new_progress, updated_by, notes = nil)
    old_progress = progress_percentage
    
    update!(
      progress_percentage: new_progress,
      progress_notes: notes || progress_notes,
      last_updated_at: Time.current,
      last_updated_by: updated_by
    )

    # 進捗更新履歴を記録
    team_goal_updates.create!(
      updated_by: updated_by,
      update_type: 'progress',
      old_value: old_progress,
      new_value: new_progress,
      notes: notes,
      changes: { progress_percentage: [old_progress, new_progress] }
    )

    # 100%達成で完了ステータスに変更
    if new_progress >= 100 && status != 'completed'
      complete!(updated_by)
    end
  end

  # KPIの現在値を更新
  def update_current_value(new_value, updated_by, notes = nil)
    return false unless goal_type == 'kpi'
    
    old_value = current_value
    new_progress = calculate_kpi_progress(new_value)
    
    update!(
      current_value: new_value,
      progress_percentage: new_progress,
      last_updated_at: Time.current,
      last_updated_by: updated_by
    )

    # KPI更新履歴を記録
    team_goal_updates.create!(
      updated_by: updated_by,
      update_type: 'progress',
      old_value: old_value,
      new_value: new_value,
      notes: notes,
      changes: { 
        current_value: [old_value, new_value],
        progress_percentage: [calculate_kpi_progress(old_value), new_progress]
      }
    )

    # 目標達成時の処理
    if new_progress >= 100 && status != 'completed'
      complete!(updated_by)
    end
  end

  # 目標を完了
  def complete!(completed_by)
    old_status = status
    
    update!(
      status: 'completed',
      completed_date: Date.current,
      progress_percentage: 100,
      last_updated_at: Time.current,
      last_updated_by: completed_by
    )

    # ステータス変更履歴を記録
    team_goal_updates.create!(
      updated_by: completed_by,
      update_type: 'status',
      old_status: old_status,
      new_status: 'completed',
      changes: { 
        status: [old_status, 'completed'],
        completed_date: [nil, Date.current]
      }
    )

    # チーム活動ログに記録
    TeamActivity.log_activity(
      team: team,
      user: completed_by,
      activity_type: 'goal_completed',
      title: "目標「#{title}」を達成しました",
      description: "目標の達成おめでとうございます！",
      target: self
    )
  end

  # 目標をキャンセル
  def cancel!(cancelled_by, reason = nil)
    old_status = status
    
    update!(
      status: 'cancelled',
      last_updated_at: Time.current,
      last_updated_by: cancelled_by
    )

    # ステータス変更履歴を記録
    team_goal_updates.create!(
      updated_by: cancelled_by,
      update_type: 'status',
      old_status: old_status,
      new_status: 'cancelled',
      notes: reason,
      changes: { status: [old_status, 'cancelled'] }
    )
  end

  # 目標を一時停止
  def pause!(paused_by, reason = nil)
    old_status = status
    
    update!(
      status: 'paused',
      last_updated_at: Time.current,
      last_updated_by: paused_by
    )

    # ステータス変更履歴を記録
    team_goal_updates.create!(
      updated_by: paused_by,
      update_type: 'status',
      old_status: old_status,
      new_status: 'paused',
      notes: reason,
      changes: { status: [old_status, 'paused'] }
    )
  end

  # 目標を再開
  def resume!(resumed_by)
    old_status = status
    
    update!(
      status: 'active',
      last_updated_at: Time.current,
      last_updated_by: resumed_by
    )

    # ステータス変更履歴を記録
    team_goal_updates.create!(
      updated_by: resumed_by,
      update_type: 'status',
      old_status: old_status,
      new_status: 'active',
      changes: { status: [old_status, 'active'] }
    )
  end

  # 残り日数
  def days_remaining
    return 0 if completed? || cancelled?
    [(target_date - Date.current).to_i, 0].max
  end

  # 期限切れかどうか
  def overdue?
    target_date < Date.current && !completed? && !cancelled?
  end

  # 期限が近いかどうか
  def due_soon?(days = 7)
    days_remaining <= days && days_remaining > 0
  end

  # 達成率を計算（KPI用）
  def achievement_rate
    return 0 if goal_type != 'kpi' || target_value.nil? || target_value.zero?
    ((current_value / target_value) * 100).round(2)
  end

  # 目標の詳細情報（API用）
  def detailed_info
    {
      id: id,
      title: title,
      description: description,
      goal_type: goal_type,
      category: category,
      priority: priority,
      status: status,
      target_value: target_value,
      current_value: current_value,
      unit: unit,
      progress_percentage: progress_percentage,
      achievement_rate: achievement_rate,
      start_date: start_date,
      target_date: target_date,
      completed_date: completed_date,
      days_remaining: days_remaining,
      overdue: overdue?,
      due_soon: due_soon?,
      created_by: {
        id: created_by.id,
        name: created_by.name
      },
      last_updated_by: last_updated_by ? {
        id: last_updated_by.id,
        name: last_updated_by.name
      } : nil,
      last_updated_at: last_updated_at,
      progress_notes: progress_notes,
      tags: tags&.split(',')&.map(&:strip) || [],
      created_at: created_at,
      updated_at: updated_at
    }
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def set_defaults
    self.metadata ||= {}
  end

  def track_changes
    @previous_changes = changes.dup
  end

  def calculate_kpi_progress(value)
    return 0 if target_value.nil? || target_value.zero?
    [((value / target_value) * 100).round(2), 100].min
  end

  def self.calculate_completion_rate(goals)
    return 0 if goals.empty?
    completed_count = goals.completed.count
    ((completed_count.to_f / goals.count) * 100).round(2)
  end

  def self.calculate_average_progress(goals)
    return 0 if goals.empty?
    total_progress = goals.sum(:progress_percentage)
    (total_progress.to_f / goals.count).round(2)
  end
end 
 