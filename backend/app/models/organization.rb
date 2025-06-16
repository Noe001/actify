class Organization < ApplicationRecord
  # リレーションシップ
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :invitations, dependent: :destroy

  # コールバック
  before_create :generate_invite_code
  before_create :set_uuid

  # バリデーション
  validates :name, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }
  validates :invite_code, uniqueness: true, allow_nil: true

  # 新しいメンバーを追加するメソッド
  def add_member(user, role = 'member')
    organization_memberships.create(user: user, role: role)
  end

  # 管理者ユーザーを追加するメソッド
  def add_admin(user)
    add_member(user, 'admin')
  end

  # ユーザーがこのチームの管理者かどうかを確認するメソッド
  def admin?(user)
    organization_memberships.exists?(user: user, role: 'admin')
  end

  # ユーザーがこのチームのメンバーかどうかを確認するメソッド
  def member?(user)
    organization_memberships.exists?(user: user)
  end

  # 招待コードを再生成するメソッド
  def regenerate_invite_code
    update(invite_code: generate_unique_code)
  end

  private

  def generate_invite_code
    self.invite_code = generate_unique_code
  end

  def generate_unique_code
    loop do
      code = SecureRandom.alphanumeric(8).upcase
      break code unless Organization.exists?(invite_code: code)
    end
  end
  
  # UUID生成
  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end 
