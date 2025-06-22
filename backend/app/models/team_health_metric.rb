class TeamHealthMetric < ApplicationRecord
  before_create :set_uuid

  belongs_to :team

  validates :measured_date, presence: true, uniqueness: { scope: :team_id }
  validates :overall_health_score, inclusion: { in: 0..100 }
  validates :engagement_score, inclusion: { in: 0..100 }
  validates :collaboration_score, inclusion: { in: 0..100 }
  validates :productivity_score, inclusion: { in: 0..100 }
  validates :satisfaction_score, inclusion: { in: 0..100 }

  # スコープ
  scope :recent, -> { order(measured_date: :desc) }
  scope :for_period, ->(start_date, end_date) { where(measured_date: start_date..end_date) }
  scope :healthy, -> { where('overall_health_score >= ?', 75) }
  scope :needs_attention, -> { where('overall_health_score < ?', 60) }

  # チームの健康度トレンドを計算
  def self.calculate_trends(team, period_days = 30)
    end_date = Date.current
    start_date = end_date - period_days.days
    
    metrics = where(team: team, measured_date: start_date..end_date)
                .order(:measured_date)
    
    return {} if metrics.count < 2

    latest = metrics.last
    previous = metrics[-2]
    
    {
      overall_health: calculate_trend(previous.overall_health_score, latest.overall_health_score),
      engagement: calculate_trend(previous.engagement_score, latest.engagement_score),
      collaboration: calculate_trend(previous.collaboration_score, latest.collaboration_score),
      productivity: calculate_trend(previous.productivity_score, latest.productivity_score),
      satisfaction: calculate_trend(previous.satisfaction_score, latest.satisfaction_score)
    }
  end

  # チームの健康度サマリーを取得
  def self.team_summary(team)
    latest_metric = where(team: team).order(:measured_date).last
    
    return nil unless latest_metric

    {
      overall_health_score: latest_metric.overall_health_score,
      engagement_score: latest_metric.engagement_score,
      collaboration_score: latest_metric.collaboration_score,
      productivity_score: latest_metric.productivity_score,
      satisfaction_score: latest_metric.satisfaction_score,
      measured_date: latest_metric.measured_date,
      health_status: determine_health_status(latest_metric.overall_health_score),
      trends: calculate_trends(team, 7), # 1週間のトレンド
      insights: generate_insights(latest_metric)
    }
  end

  # 健康度の詳細情報（API用）
  def detailed_info
    {
      id: id,
      team_id: team_id,
      measured_date: measured_date,
      overall_health_score: overall_health_score,
      engagement_score: engagement_score,
      collaboration_score: collaboration_score,
      productivity_score: productivity_score,
      satisfaction_score: satisfaction_score,
      
      # 活動メトリクス
      total_messages: total_messages,
      active_users: active_users,
      tasks_completed: tasks_completed,
      goals_achieved: goals_achieved,
      recognitions_given: recognitions_given,
      
      # 参加・エンゲージメント
      participation_rate: participation_rate,
      response_rate: response_rate,
      retention_rate: retention_rate,
      
      # 効率・品質メトリクス
      task_completion_rate: task_completion_rate,
      on_time_delivery_rate: on_time_delivery_rate,
      quality_score: quality_score,
      
      # ストレス・燃え尽き指標
      stress_level: stress_level,
      workload_balance: workload_balance,
      burnout_risk: burnout_risk,
      
      # 成長・学習
      learning_rate: learning_rate,
      skill_development: skill_development,
      
      raw_data: raw_data,
      calculation_metadata: calculation_metadata,
      calculated_at: calculated_at,
      created_at: created_at
    }
  end

  # 健康度スコアのカテゴリを判定
  def health_category
    self.class.determine_health_status(overall_health_score)
  end

  # チーム比較データを生成
  def self.team_comparison(teams, date_range = nil)
    date_range ||= 30.days.ago..Date.current
    
    teams.map do |team|
      latest_metric = where(team: team, measured_date: date_range)
                       .order(:measured_date)
                       .last
      
      if latest_metric
        {
          team: {
            id: team.id,
            name: team.name,
            member_count: team.member_count
          },
          health_score: latest_metric.overall_health_score,
          engagement_score: latest_metric.engagement_score,
          productivity_score: latest_metric.productivity_score,
          health_status: determine_health_status(latest_metric.overall_health_score),
          measured_date: latest_metric.measured_date
        }
      else
        {
          team: {
            id: team.id,
            name: team.name,
            member_count: team.member_count
          },
          health_score: nil,
          engagement_score: nil,
          productivity_score: nil,
          health_status: 'no_data',
          measured_date: nil
        }
      end
    end
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def self.calculate_trend(previous_value, current_value)
    return 'stable' if previous_value.nil? || current_value.nil?
    
    diff = current_value - previous_value
    
    if diff > 5
      'improving'
    elsif diff < -5
      'declining'
    else
      'stable'
    end
  end

  def self.determine_health_status(score)
    case score
    when 85..100
      'excellent'
    when 70..84
      'good'
    when 55..69
      'fair'
    when 40..54
      'poor'
    else
      'critical'
    end
  end

  def self.generate_insights(metric)
    insights = []

    # エンゲージメントに関するインサイト
    if metric.engagement_score < 60
      insights << {
        type: 'warning',
        category: 'engagement',
        title: 'エンゲージメント低下',
        message: 'チームのエンゲージメントが低下しています。メンバーとの1on1ミーティングや チームビルディング活動を検討してください。',
        priority: 'high'
      }
    end

    # 生産性に関するインサイト
    if metric.productivity_score < 65
      insights << {
        type: 'suggestion',
        category: 'productivity',
        title: '生産性改善の機会',
        message: 'タスクの優先順位付けやワークフローの見直しを行うことで、生産性を向上できる可能性があります。',
        priority: 'medium'
      }
    end

    # 燃え尽き症候群のリスク
    if metric.burnout_risk > 70
      insights << {
        type: 'alert',
        category: 'wellbeing',
        title: '燃え尽き症候群のリスク',
        message: 'チームメンバーの燃え尽き症候群のリスクが高まっています。ワークロードの調整と休息の確保を検討してください。',
        priority: 'high'
      }
    end

    # コラボレーションに関するインサイト
    if metric.collaboration_score > 85
      insights << {
        type: 'success',
        category: 'collaboration',
        title: '優秀なチームワーク',
        message: 'チームのコラボレーションが非常に良好です。現在の取り組みを継続してください。',
        priority: 'low'
      }
    end

    # 全体的な健康度が良好な場合
    if metric.overall_health_score > 85
      insights << {
        type: 'success',
        category: 'overall',
        title: '健全なチーム状態',
        message: 'チーム全体の健康度が優秀です。現在の管理スタイルとチーム文化を維持してください。',
        priority: 'low'
      }
    end

    insights
  end
end 
