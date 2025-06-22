class OrganizationMembership < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  # 役割は admin または member のみ
  validates :role, inclusion: { in: %w(admin member) }

  # 同じユーザーが同じチームに複数回所属することはできない
  validates :user_id, uniqueness: { scope: :organization_id }
end
