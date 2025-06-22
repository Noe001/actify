class Team < ApplicationRecord
  before_create :set_uuid
  
  # リレーションシップ
  belongs_to :workspace
  belongs_to :leader, class_name: 'User', foreign_key: 'leader_id', optional: true
  has_many :team_memberships, dependent: :destroy
  has_many :members, through: :team_memberships, source: :user
  has_many :active_memberships, -> { where(status: 'active') }, 
           class_name: 'TeamMembership'
  has_many :team_activities, dependent: :destroy
  has_many :active_members, through: :active_memberships, source: :user
  has_many :tasks, dependent: :nullify
  has_many :team_channels, dependent: :destroy
  has_many :team_messages, through: :team_channels
  has_many :team_permissions, dependent: :destroy
  has_many :team_goals, dependent: :destroy
  has_many :team_recognitions, dependent: :destroy
  has_many :team_health_metrics, dependent: :destroy

  # バリデーション
  validates :name, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }
  validates :status, inclusion: { in: %w[active inactive archived] }
  validates :color, format: { with: /\A#[0-9A-Fa-f]{6}\z/, message: "は有効な16進数カラーコードである必要があります" }

  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :by_workspace, ->(workspace) { where(workspace: workspace) }

  # コールバック
  after_update :update_member_count, if: :saved_change_to_status?
  
  # チームメンバーを追加
  def add_member(user, role = 'member', added_by = nil)
    return false if member?(user)
    
    membership = team_memberships.create!(
      user: user,
      role: role,
      status: 'active',
      joined_at: Time.current
    )
    
    update_member_count
    
    # 活動ログを記録
    if added_by
      TeamActivity.log_member_joined(self, added_by, user)
    end
    
    # 初回作成時にデフォルトチャンネルを作成
    if team_channels.empty? && membership.present?
      TeamChannel.create_default_channels(self, added_by || user)
    end
    
    # 初回作成時にデフォルト権限を作成
    if team_permissions.empty? && membership.present?
      TeamPermission.create_default_permissions(self, added_by || user)
    end
    
    membership
  end

  # チームメンバーを削除
  def remove_member(user, removed_by = nil)
    membership = team_memberships.find_by(user: user, status: 'active')
    return false unless membership
    
    membership.update!(status: 'inactive', left_at: Time.current)
    update_member_count
    
    # 活動ログを記録
    if removed_by
      TeamActivity.log_member_left(self, removed_by, user)
    end
    
    true
  end

  # ユーザーがチームメンバーかどうか
  def member?(user)
    team_memberships.exists?(user: user, status: 'active')
  end

  # ユーザーがチームリーダーかどうか
  def leader?(user)
    leader_id == user.id
  end

  # チームリーダーを変更
  def change_leader(new_leader, changed_by = nil)
    return false unless member?(new_leader)
    
    old_leader = leader
    
    update!(leader: new_leader)
    
    # 新しいリーダーの役割を'leader'に変更
    membership = team_memberships.find_by(user: new_leader, status: 'active')
    membership&.update!(role: 'leader')
    
    # 活動ログを記録
    if changed_by
      TeamActivity.log_leader_changed(self, changed_by, new_leader, old_leader)
    end
    
    true
  end

  # チームのアーカイブ
  def archive!
    update!(status: 'archived')
    team_memberships.where(status: 'active').update_all(
      status: 'inactive',
      left_at: Time.current
    )
    update_member_count
    
    # チャンネルもアーカイブ
    team_channels.active.update_all(is_archived: true)
  end

  # チームの復元
  def restore!
    update!(status: 'active')
  end

  # メンバー数の更新
  def update_member_count
    count = team_memberships.where(status: 'active').count
    update_column(:member_count, count)
  end

  # 権限チェック
  def can?(user, resource_type, action, resource_id = nil)
    return false unless member?(user)
    TeamPermission.check_permission(self, user, resource_type, action, resource_id)
  end

  # 権限を付与
  def grant_permission(user_or_role, resource_type, action, granted_by, options = {})
    TeamPermission.grant_permission(self, user_or_role, resource_type, action, granted_by, options)
  end

  # 権限を取り消し
  def revoke_permission(user_or_role, resource_type, action)
    TeamPermission.revoke_permission(self, user_or_role, resource_type, action)
  end

  # チームの統計情報
  def stats
    {
      total_members: member_count || 0,
      active_tasks: 0, # TODO: tasks.where(status: ['pending', 'in_progress']).count,
      completed_tasks: 0, # TODO: tasks.where(status: 'completed').count,
      overdue_tasks: 0, # TODO: tasks.overdue.count,
      total_tasks: 0, # TODO: tasks.count,
      completion_rate: 0, # TODO: calculate_completion_rate,
      recent_activities: team_activities.last_days(7).count,
      total_channels: team_channels.active.count,
      total_messages: team_messages.count,
      messages_today: team_messages.where('created_at >= ?', Date.current.beginning_of_day).count,
      goals_stats: TeamGoal.team_stats(self)
    }
  end

  # 詳細統計情報
  def detailed_stats(period_days = 30)
    period_start = period_days.days.ago
    
    {
      basic_stats: stats,
      productivity_metrics: {
        tasks_completed_this_period: 0, # TODO: tasks.where(status: 'completed', updated_at: period_start..Time.current).count,
        average_task_completion_time: calculate_average_completion_time(period_days),
        task_distribution_by_priority: task_distribution_by_priority,
        member_task_distribution: member_task_distribution
      },
      collaboration_metrics: {
        total_activities: team_activities.last_days(period_days).count,
        activity_by_type: activity_distribution(period_days),
        most_active_members: most_active_members(period_days),
        communication_frequency: calculate_communication_frequency(period_days)
      },
      timeline_data: {
        daily_task_completion: daily_task_completion_chart(period_days),
        member_activity_timeline: member_activity_timeline(period_days)
      }
    }
  end

  # メンバーパフォーマンス分析
  def member_performance_analysis
    # TODO: Implement when tasks.team_id column is added
    []
    # active_members.map do |member|
    #   member_tasks = tasks.where(assigned_to: member.id)
    #   
    #   {
    #     member: {
    #       id: member.id,
    #       name: member.name,
    #       avatar_url: member.avatarUrl
    #     },
    #     metrics: {
    #       total_tasks: member_tasks.count,
    #       completed_tasks: member_tasks.completed.count,
    #       overdue_tasks: member_tasks.overdue.count,
    #       completion_rate: calculate_member_completion_rate(member),
    #       average_completion_time: calculate_member_average_completion_time(member),
    #       recent_activities: team_activities.where(user: member).last_days(7).count
    #     }
    #   }
    # end
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  # 完了率を計算
  def calculate_completion_rate
    # TODO: Implement when tasks.team_id column is added
    return 0
    # return 0 if tasks.count == 0
    # (tasks.completed.count.to_f / tasks.count * 100).round(2)
  end

  # 平均完了時間を計算（日数）
  def calculate_average_completion_time(period_days = 30)
    # TODO: Implement when tasks.team_id column is added
    return 0
    # completed_tasks = tasks.completed.where('updated_at > ?', period_days.days.ago)
    # return 0 if completed_tasks.count == 0
    # 
    # total_time = completed_tasks.sum do |task|
    #   next 0 unless task.created_at && task.updated_at
    #   (task.updated_at - task.created_at) / 1.day
    # end
    # 
    # (total_time / completed_tasks.count).round(2)
  end

  # 優先度別タスク分布
  def task_distribution_by_priority
    # TODO: Implement when tasks.team_id column is added
    {}
    # tasks.group(:priority).count
  end

  # メンバー別タスク分布
  def member_task_distribution
    # TODO: Implement when tasks.team_id column is added
    []
    # active_members.map do |member|
    #   {
    #     member_name: member.name,
    #     total_tasks: tasks.where(assigned_to: member.id).count,
    #     completed_tasks: tasks.where(assigned_to: member.id, status: 'completed').count
    #   }
    # end
  end

  # 活動タイプ別分布
  def activity_distribution(period_days = 30)
    team_activities.last_days(period_days).group(:activity_type).count
  end

  # 最もアクティブなメンバー
  def most_active_members(period_days = 30, limit = 5)
    team_activities.last_days(period_days)
                   .joins(:user)
                   .group('users.id', 'users.name')
                   .count
                   .sort_by { |_, count| -count }
                   .first(limit)
                   .map { |(id, name), count| { member_id: id, member_name: name, activity_count: count } }
  end

  # コミュニケーション頻度計算
  def calculate_communication_frequency(period_days = 30)
    total_activities = team_activities.last_days(period_days).count
    return 0 if total_activities == 0 || active_members.count == 0
    
    (total_activities.to_f / active_members.count / period_days).round(2)
  end

  # 日別タスク完了チャートデータ
  def daily_task_completion_chart(period_days = 30)
    # TODO: Implement when tasks.team_id column is added
    []
    # period_start = period_days.days.ago.beginning_of_day
    # 
    # (0...period_days).map do |days_ago|
    #   date = period_start + days_ago.days
    #   next_date = date + 1.day
    #   
    #   {
    #     date: date.strftime('%Y-%m-%d'),
    #     completed_tasks: tasks.where(status: 'completed', updated_at: date...next_date).count
    #   }
    # end
  end

  # メンバー活動タイムライン
  def member_activity_timeline(period_days = 30)
    active_members.limit(10).map do |member|
      activities = team_activities.where(user: member).last_days(period_days).recent.limit(10)
      
      {
        member: {
          id: member.id,
          name: member.name,
          avatar_url: member.avatarUrl
        },
        recent_activities: activities.map do |activity|
          {
            type: activity.activity_type,
            title: activity.title,
            occurred_at: activity.occurred_at
          }
        end
      }
    end
  end

  # メンバー個別の完了率
  def calculate_member_completion_rate(member)
    # TODO: Implement when tasks.team_id column is added
    return 0
    # member_tasks = tasks.where(assigned_to: member.id)
    # return 0 if member_tasks.count == 0
    # 
    # (member_tasks.completed.count.to_f / member_tasks.count * 100).round(2)
  end

  # メンバー個別の平均完了時間
  def calculate_member_average_completion_time(member)
    # TODO: Implement when tasks.team_id column is added
    return 0
    # completed_tasks = tasks.where(assigned_to: member.id, status: 'completed')
    # return 0 if completed_tasks.count == 0
    # 
    # total_time = completed_tasks.sum do |task|
    #   next 0 unless task.created_at && task.updated_at
    #   (task.updated_at - task.created_at) / 1.day
    # end
    # 
    # (total_time / completed_tasks.count).round(2)
  end
end 
 