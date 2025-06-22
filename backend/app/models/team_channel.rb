class TeamChannel < ApplicationRecord
  before_create :set_uuid
  after_initialize :set_defaults

  belongs_to :team
  belongs_to :created_by, class_name: 'User'
  has_many :team_messages, dependent: :destroy
  has_many :team_message_reads, through: :team_messages

  validates :name, presence: true, length: { maximum: 50 }
  validates :description, length: { maximum: 200 }
  validates :channel_type, inclusion: { in: %w[public private direct] }
  validates :name, uniqueness: { scope: :team_id }

  # チャンネルタイプの定数
  CHANNEL_TYPES = %w[public private direct].freeze

  # スコープ
  scope :active, -> { where(is_archived: false) }
  scope :archived, -> { where(is_archived: true) }
  scope :by_type, ->(type) { where(channel_type: type) }
  scope :recent_activity, -> { order(last_message_at: :desc) }

  # デフォルトチャンネルを作成
  def self.create_default_channels(team, creator)
    [
      {
        name: 'general',
        description: '一般的な話題のチャンネル',
        channel_type: 'public'
      },
      {
        name: 'random',
        description: '雑談用チャンネル',
        channel_type: 'public'
      }
    ].each do |channel_data|
      create!(
        team: team,
        created_by: creator,
        **channel_data
      )
    end
  end

  # チャンネルをアーカイブ
  def archive!
    update!(is_archived: true)
  end

  # チャンネルを復元
  def unarchive!
    update!(is_archived: false)
  end

  # 最新メッセージを取得
  def latest_messages(limit = 50)
    team_messages.includes(:user, :parent_message)
                 .where(is_deleted: false)
                 .order(created_at: :desc)
                 .limit(limit)
                 .reverse
  end

  # 未読メッセージ数を取得（特定ユーザー用）
  def unread_count_for(user)
    return 0 unless user

    last_read = team_message_reads.joins(:team_message)
                                  .where(user: user, team_messages: { team_channel: self })
                                  .maximum(:read_at)

    if last_read
      team_messages.where('created_at > ?', last_read).count
    else
      team_messages.count
    end
  end

  # メッセージを既読にマーク
  def mark_messages_as_read(user, up_to_message = nil)
    return unless user

    messages_to_mark = team_messages.where(is_deleted: false)
    
    if up_to_message
      messages_to_mark = messages_to_mark.where('created_at <= ?', up_to_message.created_at)
    end

    messages_to_mark.find_each do |message|
      message.mark_as_read_by(user)
    end

    update_last_message_timestamp
  end

  # メッセージ送信
  def send_message(user, content, message_type = 'text', metadata = {})
    message = team_messages.create!(
      user: user,
      content: content,
      message_type: message_type,
      metadata: metadata
    )

    update_last_message_timestamp
    increment_message_count

    # チーム活動ログに記録
    if team && user
      TeamActivity.log_activity(
        team: team,
        user: user,
        activity_type: 'message_sent',
        title: "#{name}チャンネルにメッセージを投稿しました",
        description: content.truncate(100),
        target: message
      )
    end

    message
  end

  # チャンネル統計
  def stats
    {
      total_messages: message_count,
      active_members: active_member_count,
      messages_today: messages_today_count,
      last_activity: last_message_at
    }
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def set_defaults
    self.settings ||= {}
  end

  def update_last_message_timestamp
    update_column(:last_message_at, Time.current)
  end

  def increment_message_count
    increment!(:message_count)
  end

  def active_member_count
    team.active_members.count
  end

  def messages_today_count
    team_messages.where('created_at >= ?', Date.current.beginning_of_day).count
  end
end 
 