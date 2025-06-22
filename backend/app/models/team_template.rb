class TeamTemplate < ApplicationRecord
  before_create :set_uuid

  belongs_to :created_by, class_name: 'User'
  belongs_to :workspace, optional: true

  validates :name, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }
  validates :category, inclusion: { in: %w[development marketing hr finance general] }
  validates :template_type, inclusion: { in: %w[public private workspace] }

  # 定数
  CATEGORIES = %w[development marketing hr finance general].freeze
  TEMPLATE_TYPES = %w[public private workspace].freeze

  # スコープ
  scope :active, -> { where(is_active: true) }
  scope :featured, -> { where(is_featured: true) }
  scope :public_templates, -> { where(template_type: 'public') }
  scope :workspace_templates, ->(workspace) { where(template_type: 'workspace', workspace: workspace) }
  scope :by_category, ->(category) { where(category: category) }
  scope :popular, -> { order(usage_count: :desc) }
  scope :highly_rated, -> { where('rating >= ?', 4.0).order(rating: :desc) }

  # テンプレートからチームを作成
  def create_team_from_template(workspace, creator, team_name, team_description = nil)
    # 基本チーム作成
    team = Team.create!(
      workspace: workspace,
      name: team_name,
      description: team_description || description,
      color: team_settings.dig('color') || '#3B82F6',
      leader: creator
    )

    # デフォルトメンバーを追加
    team.add_member(creator, 'admin', creator)

    # デフォルトチャンネルを作成
    create_default_channels(team, creator)

    # デフォルト権限を設定
    create_default_permissions(team, creator)

    # デフォルト目標を作成
    create_default_goals(team, creator)

    # カスタムフィールドを設定
    apply_custom_fields(team)

    # 使用回数を増加
    increment!(:usage_count)

    team
  end

  # テンプレートを評価
  def add_rating(rating, user)
    return false unless (1..5).include?(rating)

    new_total = (self.rating * rating_count) + rating
    new_count = rating_count + 1
    new_average = (new_total / new_count.to_f).round(2)

    update!(
      rating: new_average,
      rating_count: new_count
    )
  end

  # テンプレートの詳細情報（API用）
  def detailed_info
    {
      id: id,
      name: name,
      description: description,
      category: category,
      template_type: template_type,
      created_by: {
        id: created_by.id,
        name: created_by.name
      },
      team_settings: team_settings,
      default_roles: default_roles,
      default_permissions: default_permissions,
      default_channels: default_channels,
      default_goals: default_goals,
      custom_fields: custom_fields,
      workflows: workflows,
      usage_count: usage_count,
      rating: rating,
      rating_count: rating_count,
      tags: tags&.split(',')&.map(&:strip) || [],
      is_featured: is_featured,
      is_active: is_active,
      created_at: created_at
    }
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def create_default_channels(team, creator)
    return unless default_channels.present?

    default_channels.each do |channel_config|
      team.team_channels.create!(
        name: channel_config['name'],
        description: channel_config['description'],
        channel_type: channel_config['channel_type'] || 'public',
        created_by: creator
      )
    end
  end

  def create_default_permissions(team, creator)
    return unless default_permissions.present?

    default_permissions.each do |permission_config|
      TeamPermission.create!(
        team: team,
        role: permission_config['role'],
        resource_type: permission_config['resource_type'],
        action: permission_config['action'],
        granted_by: creator
      )
    end
  end

  def create_default_goals(team, creator)
    return unless default_goals.present?

    default_goals.each do |goal_config|
      team.team_goals.create!(
        title: goal_config['title'],
        description: goal_config['description'],
        goal_type: goal_config['goal_type'] || 'objective',
        category: goal_config['category'] || 'performance',
        priority: goal_config['priority'] || 'medium',
        start_date: Date.current,
        target_date: goal_config['target_date']&.to_date || 30.days.from_now.to_date,
        target_value: goal_config['target_value'],
        unit: goal_config['unit'],
        created_by: creator,
        last_updated_by: creator
      )
    end
  end

  def apply_custom_fields(team)
    return unless custom_fields.present?
    # カスタムフィールドの適用ロジック（実装は用途に応じて）
  end
end 
