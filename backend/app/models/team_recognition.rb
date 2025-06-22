class TeamRecognition < ApplicationRecord
  before_create :set_uuid

  belongs_to :team
  belongs_to :recipient, class_name: 'User'
  belongs_to :given_by, class_name: 'User'

  validates :recognition_type, inclusion: { in: %w[praise achievement milestone collaboration] }
  validates :category, inclusion: { in: %w[performance teamwork innovation leadership] }
  validates :title, presence: true, length: { maximum: 100 }
  validates :message, length: { maximum: 500 }
  validates :achievement_level, inclusion: { in: %w[bronze silver gold platinum] }, allow_nil: true

  # 定数
  RECOGNITION_TYPES = %w[praise achievement milestone collaboration].freeze
  CATEGORIES = %w[performance teamwork innovation leadership].freeze
  ACHIEVEMENT_LEVELS = %w[bronze silver gold platinum].freeze

  # スコープ
  scope :public_recognitions, -> { where(is_public: true) }
  scope :featured, -> { where(is_featured: true) }
  scope :by_type, ->(type) { where(recognition_type: type) }
  scope :by_category, ->(category) { where(category: category) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_recipient, ->(user) { where(recipient: user) }
  scope :by_giver, ->(user) { where(given_by: user) }

  # レベル別ポイント設定
  LEVEL_POINTS = {
    'bronze' => 10,
    'silver' => 25,
    'gold' => 50,
    'platinum' => 100
  }.freeze

  # ユーザーの表彰統計
  def self.recipient_stats(user, team = nil)
    recognitions = team ? where(team: team, recipient: user) : where(recipient: user)
    
    {
      total_recognitions: recognitions.count,
      total_points: recognitions.sum(:points_awarded),
      by_type: recognitions.group(:recognition_type).count,
      by_category: recognitions.group(:category).count,
      by_level: recognitions.group(:achievement_level).count,
      recent_recognitions: recognitions.recent.limit(5).map(&:summary_info)
    }
  end

  # チームの表彰統計
  def self.team_stats(team)
    recognitions = where(team: team)
    
    {
      total_recognitions: recognitions.count,
      total_points_awarded: recognitions.sum(:points_awarded),
      active_recognizers: recognitions.distinct.count(:given_by_id),
      top_recipients: recognitions.group(:recipient_id)
                                 .order('count_all DESC')
                                 .limit(5)
                                 .count
                                 .map { |user_id, count| 
                                   user = User.find(user_id)
                                   { user: { id: user.id, name: user.name }, count: count }
                                 },
      recognition_trends: calculate_recognition_trends(team)
    }
  end

  # 表彰を作成
  def self.create_recognition(team, recipient, given_by, recognition_data)
    points = calculate_points(recognition_data[:recognition_type], recognition_data[:achievement_level])
    
    recognition = create!(
      team: team,
      recipient: recipient,
      given_by: given_by,
      points_awarded: points,
      **recognition_data
    )

    # チーム活動ログに記録
    TeamActivity.log_activity(
      team: team,
      user: given_by,
      activity_type: 'recognition_given',
      title: "#{recipient.name}さんに表彰「#{recognition.title}」を送りました",
      description: recognition.message&.truncate(100),
      target: recognition
    )

    recognition
  end

  # 表彰の詳細情報（API用）
  def detailed_info
    {
      id: id,
      recognition_type: recognition_type,
      category: category,
      title: title,
      message: message,
      badge_name: badge_name,
      badge_color: badge_color,
      badge_icon: badge_icon,
      points_awarded: points_awarded,
      achievement_level: achievement_level,
      is_public: is_public,
      is_featured: is_featured,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        avatar_url: recipient.avatarUrl
      },
      given_by: {
        id: given_by.id,
        name: given_by.name,
        avatar_url: given_by.avatarUrl
      },
      related_resource: related_resource_info,
      created_at: created_at
    }
  end

  # サマリー情報
  def summary_info
    {
      id: id,
      title: title,
      recognition_type: recognition_type,
      category: category,
      points_awarded: points_awarded,
      achievement_level: achievement_level,
      given_by_name: given_by.name,
      created_at: created_at
    }
  end

  # バッジ情報を生成
  def generate_badge_info
    badge_configs = {
      'performance' => { icon: '🏆', color: '#FFD700' },
      'teamwork' => { icon: '🤝', color: '#4F46E5' },
      'innovation' => { icon: '💡', color: '#10B981' },
      'leadership' => { icon: '👨‍💼', color: '#EF4444' }
    }

    config = badge_configs[category] || { icon: '⭐', color: '#6B7280' }
    level_colors = {
      'bronze' => '#CD7F32',
      'silver' => '#C0C0C0',
      'gold' => '#FFD700',
      'platinum' => '#E5E4E2'
    }

    {
      icon: config[:icon],
      color: achievement_level ? level_colors[achievement_level] : config[:color],
      name: "#{category.humanize} #{achievement_level&.humanize || 'Recognition'}"
    }
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def related_resource_info
    return nil unless related_resource_type && related_resource_id

    case related_resource_type
    when 'task'
      task = Task.find_by(id: related_resource_id)
      task ? { type: 'task', id: task.id, title: task.title } : nil
    when 'goal'
      goal = TeamGoal.find_by(id: related_resource_id)
      goal ? { type: 'goal', id: goal.id, title: goal.title } : nil
    else
      nil
    end
  end

  def self.calculate_points(recognition_type, achievement_level)
    base_points = {
      'praise' => 5,
      'achievement' => 15,
      'milestone' => 20,
      'collaboration' => 10
    }

    points = base_points[recognition_type] || 5
    
    if achievement_level
      multiplier = {
        'bronze' => 1.0,
        'silver' => 1.5,
        'gold' => 2.0,
        'platinum' => 3.0
      }[achievement_level] || 1.0
      
      points = (points * multiplier).to_i
    end

    points
  end

  def self.calculate_recognition_trends(team)
    # 過去30日間の表彰トレンド
    end_date = Date.current
    start_date = end_date - 29.days
    
    daily_counts = (start_date..end_date).map do |date|
      count = where(team: team)
              .where(created_at: date.beginning_of_day..date.end_of_day)
              .count
      
      { date: date, count: count }
    end

    {
      daily_recognitions: daily_counts,
      total_period: daily_counts.sum { |d| d[:count] },
      average_daily: (daily_counts.sum { |d| d[:count] } / 30.0).round(2)
    }
  end
end 
