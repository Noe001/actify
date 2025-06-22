class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :department, :position, :bio, :avatarUrl, 
             :role, :status, :display_name, :profile_complete, 
             :paid_leave_balance, :sick_leave_balance,
             :monthly_work_hours, :monthly_overtime_hours,
             :created_at, :updated_at, :organizations

  # 表示名
  def display_name
    object.display_name
  end

  # プロフィール完成度
  def profile_complete
    object.profile_complete?
  end

  # 有給休暇残日数
  def paid_leave_balance
    object.paid_leave_balance
  end

  # 病気休暇残日数
  def sick_leave_balance
    object.sick_leave_balance
  end

  # 今月の労働時間
  def monthly_work_hours
    object.monthly_work_hours
  end

  # 今月の残業時間
  def monthly_overtime_hours
    object.monthly_overtime_hours
  end

  # 所属チームの情報（N+1問題対応済み）
  def organizations
    # eager loadingされたassociationを活用
    # organization_membershipsとorganizationが既にロードされていることを前提とする
    if object.association(:organization_memberships).loaded? && 
       object.organization_memberships.all? { |membership| membership.association(:organization).loaded? }
      
      # 既にロードされたデータを使用してN+1問題を回避
      object.organization_memberships.map do |membership|
        {
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
          joined_at: membership.created_at,
          updated_at: membership.updated_at
        }
      end
    else
      # フォールバック：eager loadingされていない場合の処理
      # ログで警告を出し、最小限のクエリで対応
      Rails.logger.warn "UserSerializer#organizations: Association not preloaded, potential N+1 query"
      
      # 一度のクエリで全ての関連データを取得
      memberships = object.organization_memberships.includes(:organization)
      memberships.map do |membership|
        {
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
          joined_at: membership.created_at,
          updated_at: membership.updated_at
        }
      end
    end
  end
end 
