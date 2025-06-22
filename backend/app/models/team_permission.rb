class TeamPermission < ApplicationRecord
  before_create :set_uuid

  belongs_to :team
  belongs_to :user, optional: true # nullの場合はロールベース権限
  belongs_to :granted_by, class_name: 'User'

  validates :resource_type, presence: true
  validates :action, presence: true
  validates :role, presence: true, if: -> { user.nil? }
  validates :user, presence: true, if: -> { role.nil? }

  # リソースタイプの定数
  RESOURCE_TYPES = %w[
    task channel meeting file
    team_settings member_management
    analytics reports permissions
  ].freeze

  # アクションの定数
  ACTIONS = %w[create read update delete manage].freeze

  # ロールの定数
  ROLES = %w[admin manager member guest].freeze

  # スコープ
  scope :active, -> { where(granted: true) }
  scope :expired, -> { where('expires_at < ?', Time.current) }
  scope :not_expired, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_role, ->(role) { where(role: role) }
  scope :for_resource, ->(type, id = nil) { where(resource_type: type, resource_id: id) }
  scope :for_action, ->(action) { where(action: action) }

  # デフォルト権限を作成
  def self.create_default_permissions(team, granted_by)
    default_permissions = [
      # 管理者権限
      { role: 'admin', resource_type: 'team_settings', action: 'manage' },
      { role: 'admin', resource_type: 'member_management', action: 'manage' },
      { role: 'admin', resource_type: 'permissions', action: 'manage' },
      { role: 'admin', resource_type: 'analytics', action: 'read' },
      { role: 'admin', resource_type: 'reports', action: 'create' },
      
      # マネージャー権限
      { role: 'manager', resource_type: 'task', action: 'manage' },
      { role: 'manager', resource_type: 'channel', action: 'manage' },
      { role: 'manager', resource_type: 'meeting', action: 'manage' },
      { role: 'manager', resource_type: 'analytics', action: 'read' },
      
      # メンバー権限
      { role: 'member', resource_type: 'task', action: 'create' },
      { role: 'member', resource_type: 'task', action: 'read' },
      { role: 'member', resource_type: 'task', action: 'update' },
      { role: 'member', resource_type: 'channel', action: 'read' },
      { role: 'member', resource_type: 'channel', action: 'create' },
      { role: 'member', resource_type: 'meeting', action: 'read' },
      { role: 'member', resource_type: 'file', action: 'create' },
      { role: 'member', resource_type: 'file', action: 'read' },
      
      # ゲスト権限
      { role: 'guest', resource_type: 'task', action: 'read' },
      { role: 'guest', resource_type: 'channel', action: 'read' },
      { role: 'guest', resource_type: 'meeting', action: 'read' }
    ]

    default_permissions.each do |permission_data|
      create!(
        team: team,
        granted_by: granted_by,
        **permission_data
      )
    end
  end

  # 権限チェック
  def self.check_permission(team, user, resource_type, action, resource_id = nil)
    return false unless team && user && resource_type && action

    # 有効期限チェック
    permissions = active.not_expired.where(team: team)

    # ユーザー固有の権限をチェック
    user_permission = permissions.for_user(user)
                                .for_resource(resource_type, resource_id)
                                .for_action(action)
                                .first

    return user_permission.granted if user_permission

    # ロールベースの権限をチェック
    user_role = team.team_memberships.find_by(user: user)&.role
    return false unless user_role

    role_permission = permissions.for_role(user_role)
                                .for_resource(resource_type, resource_id)
                                .for_action(action)
                                .first

    return role_permission&.granted || false
  end

  # 権限を付与
  def self.grant_permission(team, user_or_role, resource_type, action, granted_by, options = {})
    permission_data = {
      team: team,
      resource_type: resource_type,
      action: action,
      granted_by: granted_by,
      granted: true
    }.merge(options)

    if user_or_role.is_a?(User)
      permission_data[:user] = user_or_role
    else
      permission_data[:role] = user_or_role.to_s
    end

    create!(permission_data)
  end

  # 権限を取り消し
  def self.revoke_permission(team, user_or_role, resource_type, action)
    permissions = where(team: team, resource_type: resource_type, action: action)
    
    if user_or_role.is_a?(User)
      permissions = permissions.where(user: user_or_role)
    else
      permissions = permissions.where(role: user_or_role.to_s)
    end

    permissions.update_all(granted: false)
  end

  # 権限一覧を取得
  def self.list_permissions(team, user_or_role = nil)
    permissions = where(team: team).active.not_expired
    
    if user_or_role
      if user_or_role.is_a?(User)
        permissions = permissions.where(user: user_or_role)
      else
        permissions = permissions.where(role: user_or_role.to_s)
      end
    end

    permissions.group_by(&:resource_type)
           .transform_values { |perms| perms.map(&:action) }
  end

  # 権限の有効期限をチェック
  def expired?
    expires_at && expires_at < Time.current
  end

  # 権限を延長
  def extend_expiry(new_expiry_date)
    update!(expires_at: new_expiry_date)
  end

  # 条件チェック（JSON形式の条件を評価）
  def check_conditions(context = {})
    return true if conditions.blank?

    begin
      condition_hash = JSON.parse(conditions)
      # 簡単な条件評価ロジック（必要に応じて拡張）
      condition_hash.all? do |key, expected_value|
        context[key.to_sym] == expected_value
      end
    rescue JSON::ParserError
      false
    end
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end 
