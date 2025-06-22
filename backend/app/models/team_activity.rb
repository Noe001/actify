class TeamActivity < ApplicationRecord
  before_create :set_uuid

  # JSONフィールドのデフォルト値設定
  after_initialize :set_defaults
  
  belongs_to :team
  belongs_to :user
  belongs_to :target, polymorphic: true, optional: true

  validates :activity_type, presence: true
  validates :title, presence: true
  validates :occurred_at, presence: true

  # 活動タイプの定数
  ACTIVITY_TYPES = [
    'member_joined',
    'member_left',
    'member_role_changed',
    'leader_changed',
    'task_assigned',
    'task_completed',
    'task_overdue',
    'meeting_scheduled',
    'meeting_completed',
    'team_created',
    'team_updated',
    'team_archived',
    'goal_achieved',
    'milestone_reached'
  ].freeze

  validates :activity_type, inclusion: { in: ACTIVITY_TYPES }

  # スコープ
  scope :recent, -> { order(occurred_at: :desc) }
  scope :unread, -> { where(is_read: false) }
  scope :by_type, ->(type) { where(activity_type: type) }
  scope :for_team, ->(team_id) { where(team_id: team_id) }
  scope :last_days, ->(days) { where('occurred_at > ?', days.days.ago) }

  # 活動を既読にする
  def mark_as_read!
    update!(is_read: true)
  end

  # 活動ログを作成するクラスメソッド
  def self.log_activity(team:, user:, activity_type:, title:, description: nil, target: nil, metadata: {})
    create!(
      team: team,
      user: user,
      activity_type: activity_type,
      title: title,
      description: description,
      target: target,
      metadata: metadata,
      occurred_at: Time.current
    )
  end

  # メンバー参加ログ
  def self.log_member_joined(team, user, new_member)
    log_activity(
      team: team,
      user: user,
      activity_type: 'member_joined',
      title: "#{new_member.name}がチームに参加しました",
      description: "#{user.name}が#{new_member.name}をチームに追加しました",
      target: new_member,
      metadata: { member_role: 'member' }
    )
  end

  # メンバー退出ログ
  def self.log_member_left(team, user, removed_member)
    log_activity(
      team: team,
      user: user,
      activity_type: 'member_left',
      title: "#{removed_member.name}がチームから退出しました",
      description: "#{user.name}が#{removed_member.name}をチームから削除しました",
      target: removed_member,
      metadata: { former_role: 'member' }
    )
  end

  # リーダー変更ログ
  def self.log_leader_changed(team, user, new_leader, old_leader = nil)
    description = old_leader ? 
      "#{user.name}がチームリーダーを#{old_leader.name}から#{new_leader.name}に変更しました" :
      "#{user.name}が#{new_leader.name}をチームリーダーに設定しました"
    
    log_activity(
      team: team,
      user: user,
      activity_type: 'leader_changed',
      title: "チームリーダーが変更されました",
      description: description,
      target: new_leader,
      metadata: { 
        new_leader_id: new_leader.id,
        old_leader_id: old_leader&.id
      }
    )
  end

  # タスク関連ログ
  def self.log_task_assigned(team, user, task, assignee)
    log_activity(
      team: team,
      user: user,
      activity_type: 'task_assigned',
      title: "新しいタスクが割り当てられました",
      description: "#{user.name}が#{assignee.name}にタスク「#{task.title}」を割り当てました",
      target: task,
      metadata: { 
        task_id: task.id,
        assignee_id: assignee.id,
        due_date: task.due_date
      }
    )
  end

  def self.log_task_completed(team, user, task)
    log_activity(
      team: team,
      user: user,
      activity_type: 'task_completed',
      title: "タスクが完了されました",
      description: "#{user.name}がタスク「#{task.title}」を完了しました",
      target: task,
      metadata: { 
        task_id: task.id,
        completion_date: Time.current
      }
    )
  end

  # チーム更新ログ
  def self.log_team_updated(team, user, changes)
    log_activity(
      team: team,
      user: user,
      activity_type: 'team_updated',
      title: "チーム情報が更新されました",
      description: "#{user.name}がチーム情報を更新しました",
      target: team,
      metadata: { changes: changes }
    )
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def set_defaults
    self.metadata ||= {}
  end
end 
 