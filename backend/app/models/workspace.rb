class Workspace < ApplicationRecord
  # リレーションシップ
  has_many :workspace_memberships, dependent: :destroy
  has_many :users, through: :workspace_memberships
  has_many :organizations, dependent: :destroy
  has_many :tasks, dependent: :destroy
  has_many :meetings, dependent: :destroy
  has_many :manuals, dependent: :destroy
  has_many :attendances, through: :users
  has_many :leave_requests, through: :users
  has_many :teams, dependent: :destroy

  # コールバック
  before_create :generate_invite_code
  before_create :set_uuid
  before_save :normalize_subdomain

  # バリデーション
  validates :name, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }
  validates :subdomain, presence: true, 
                       uniqueness: { case_sensitive: false },
                       format: { with: /\A[a-z0-9][a-z0-9\-]*[a-z0-9]\z/, message: "は英数字とハイフンのみ使用可能です" },
                       length: { in: 3..50 }
  validates :invite_code, uniqueness: true, allow_nil: true
  validates :status, inclusion: { in: %w[active inactive suspended archived] }

  # スコープ
  scope :active, -> { where(status: 'active') }
  scope :public_workspaces, -> { where(is_public: true, status: 'active') }

  # 企業管理者を追加
  def add_admin(user)
    workspace_memberships.create!(user: user, role: 'admin', status: 'active', joined_at: Time.current)
  end

  # 一般メンバーを追加
  def add_member(user, role = 'member')
    workspace_memberships.create!(user: user, role: role, status: 'active', joined_at: Time.current)
  end

  # ユーザーが企業管理者かどうか
  def admin?(user)
    workspace_memberships.exists?(user: user, role: 'admin', status: 'active')
  end

  # ユーザーが企業メンバーかどうか
  def member?(user)
    workspace_memberships.exists?(user: user, status: 'active')
  end

  # ユーザーの企業内での役割を取得
  def user_role(user)
    membership = workspace_memberships.find_by(user: user, status: 'active')
    membership&.role
  end

  # 企業の統計情報
  def stats
    {
      total_members: workspace_memberships.where(status: 'active').count,
      admin_count: workspace_memberships.where(role: 'admin', status: 'active').count,
      department_count: users.joins(:workspace_memberships)
                            .where(workspace_memberships: { status: 'active' })
                            .distinct.count('department'),
      active_tasks: tasks.where(status: ['pending', 'in_progress']).count,
      completed_tasks: tasks.where(status: 'completed').count,
      total_meetings: meetings.count,
      published_manuals: manuals.where(status: 'published').count
    }
  end

  # 企業設定の管理
  def update_settings(new_settings)
    current_settings = settings || {}
    self.settings = current_settings.merge(new_settings)
    save!
  end

  # 招待コードを再生成
  def regenerate_invite_code!
    update!(invite_code: generate_unique_code)
  end

  # 企業のアーカイブ
  def archive!
    update!(status: 'archived', archived_at: Time.current)
    workspace_memberships.update_all(status: 'inactive', left_at: Time.current)
  end

  # 企業の復元
  def restore!
    update!(status: 'active', archived_at: nil)
  end

  # セキュリティ: データアクセス制御
  def accessible_by?(user)
    return false unless user
    member?(user) || user.system_admin?
  end

  # 部門一覧を取得
  def departments
    users.joins(:workspace_memberships)
         .where(workspace_memberships: { status: 'active' })
         .where.not(department: [nil, ''])
         .distinct
         .pluck(:department)
         .compact
         .sort
  end

  # 部門別メンバー数
  def department_member_counts
    users.joins(:workspace_memberships)
         .where(workspace_memberships: { status: 'active' })
         .where.not(department: [nil, ''])
         .group(:department)
         .count
  end

  private

  def generate_invite_code
    self.invite_code = generate_unique_code
  end

  def generate_unique_code
    loop do
      code = SecureRandom.alphanumeric(12).upcase
      break code unless Workspace.exists?(invite_code: code)
    end
  end

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def normalize_subdomain
    self.subdomain = subdomain.downcase.strip if subdomain.present?
  end
end 
