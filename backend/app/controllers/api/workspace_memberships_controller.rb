class Api::WorkspaceMembershipsController < ApplicationController
  before_action :authenticate_user
  before_action :set_workspace
  before_action :set_membership, only: [:show, :update, :destroy, :activate, :deactivate]
  before_action :ensure_workspace_admin, except: [:index, :show]

  # GET /api/workspaces/:workspace_id/memberships
  def index
    @memberships = @workspace.workspace_memberships
                            .includes(:user)
                            .order(created_at: :desc)
    
    memberships_data = @memberships.map do |membership|
      {
        id: membership.id,
        user_id: membership.user_id,
        user_name: membership.user.name,
        user_email: membership.user.email,
        user_avatar: membership.user.avatarUrl,
        role: membership.role,
        status: membership.status,
        department: membership.user.department,
        position: membership.user.position,
        joined_at: membership.joined_at,
        left_at: membership.left_at,
        last_activity_at: membership.last_activity_at
      }
    end
    
    render json: {
      success: true,
      data: memberships_data,
      message: 'メンバーシップ一覧を取得しました'
    }
  end

  # GET /api/workspaces/:workspace_id/memberships/:id
  def show
    membership_data = {
      id: @membership.id,
      user_id: @membership.user_id,
      user_name: @membership.user.name,
      user_email: @membership.user.email,
      user_avatar: @membership.user.avatarUrl,
      role: @membership.role,
      status: @membership.status,
      department: @membership.user.department,
      position: @membership.user.position,
      joined_at: @membership.joined_at,
      left_at: @membership.left_at,
      last_activity_at: @membership.last_activity_at,
      permissions: {
        can_manage_users: @membership.can_manage_users?,
        can_manage_department: @membership.can_manage_department?,
        can_view_analytics: @membership.can_view_analytics?
      }
    }
    
    render json: {
      success: true,
      data: membership_data,
      message: 'メンバーシップ情報を取得しました'
    }
  end

  # POST /api/workspaces/:workspace_id/memberships
  def create
    user = User.find_by(email: membership_params[:email])
    
    unless user
      return render json: {
        success: false,
        message: '指定されたメールアドレスのユーザーが見つかりません'
      }, status: :not_found
    end
    
    if @workspace.member?(user)
      return render json: {
        success: false,
        message: 'このユーザーは既に企業のメンバーです'
      }, status: :unprocessable_entity
    end
    
    @membership = @workspace.workspace_memberships.new(
      user: user,
      role: membership_params[:role] || 'member',
      status: 'active'
    )
    
    if @membership.save
      render json: {
        success: true,
        data: {
          id: @membership.id,
          user_id: @membership.user_id,
          user_name: @membership.user.name,
          user_email: @membership.user.email,
          role: @membership.role,
          status: @membership.status,
          joined_at: @membership.joined_at
        },
        message: 'メンバーを追加しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: 'メンバーの追加に失敗しました',
        errors: @membership.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/workspaces/:workspace_id/memberships/:id
  def update
    # 最後の管理者の権限は変更できない
    if @membership.admin? && @workspace.workspace_memberships.admins.count == 1 && membership_update_params[:role] != 'admin'
      return render json: {
        success: false,
        message: '最後の管理者の権限は変更できません'
      }, status: :unprocessable_entity
    end
    
    if @membership.update(membership_update_params)
      render json: {
        success: true,
        data: {
          id: @membership.id,
          user_id: @membership.user_id,
          user_name: @membership.user.name,
          role: @membership.role,
          status: @membership.status
        },
        message: 'メンバーシップを更新しました'
      }
    else
      render json: {
        success: false,
        message: 'メンバーシップの更新に失敗しました',
        errors: @membership.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/workspaces/:workspace_id/memberships/:id
  def destroy
    # 最後の管理者は削除できない
    if @membership.admin? && @workspace.workspace_memberships.admins.count == 1
      return render json: {
        success: false,
        message: '最後の管理者は削除できません'
      }, status: :unprocessable_entity
    end
    
    @membership.deactivate!
    
    render json: {
      success: true,
      message: 'メンバーシップを削除しました'
    }
  end

  # POST /api/workspaces/:workspace_id/memberships/:id/activate
  def activate
    @membership.activate!
    
    render json: {
      success: true,
      data: {
        id: @membership.id,
        status: @membership.status,
        joined_at: @membership.joined_at
      },
      message: 'メンバーシップを有効化しました'
    }
  end

  # POST /api/workspaces/:workspace_id/memberships/:id/deactivate
  def deactivate
    # 最後の管理者は無効化できない
    if @membership.admin? && @workspace.workspace_memberships.admins.count == 1
      return render json: {
        success: false,
        message: '最後の管理者は無効化できません'
      }, status: :unprocessable_entity
    end
    
    @membership.deactivate!
    
    render json: {
      success: true,
      data: {
        id: @membership.id,
        status: @membership.status,
        left_at: @membership.left_at
      },
      message: 'メンバーシップを無効化しました'
    }
  end

  # POST /api/workspaces/:workspace_id/bulk_invite
  def bulk_invite
    emails = params[:emails].split(/[\s,;]+/).map(&:strip).reject(&:blank?).uniq
    results = { success: [], failure: [] }
    
    emails.each do |email|
      user = User.find_by(email: email)
      
      if user && !@workspace.member?(user)
        membership = @workspace.add_member(user, params[:role] || 'member')
        results[:success] << { email: email, name: user.name }
      else
        results[:failure] << { email: email, reason: user ? 'already_member' : 'user_not_found' }
      end
    end
    
    render json: {
      success: true,
      data: results,
      message: "#{results[:success].count}人のメンバーを招待しました"
    }
  end

  # GET /api/workspaces/:workspace_id/memberships/export
  def export
    @memberships = @workspace.workspace_memberships
                            .includes(:user)
                            .order(created_at: :desc)
    
    memberships_data = @memberships.map do |membership|
      {
        id: membership.id,
        user_name: membership.user.name,
        user_email: membership.user.email,
        role: membership.role,
        status: membership.status,
        department: membership.user.department,
        position: membership.user.position,
        joined_at: membership.joined_at.strftime('%Y-%m-%d'),
        left_at: membership.left_at&.strftime('%Y-%m-%d'),
        last_activity_at: membership.last_activity_at&.strftime('%Y-%m-%d %H:%M:%S')
      }
    end
    
    render json: {
      success: true,
      data: memberships_data,
      message: 'メンバーシップデータをエクスポートしました'
    }
  end

  private

  def set_workspace
    @workspace = Workspace.find(params[:workspace_id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: '企業が見つかりません'
    }, status: :not_found
  end

  def set_membership
    @membership = @workspace.workspace_memberships.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'メンバーシップが見つかりません'
    }, status: :not_found
  end

  def ensure_workspace_admin
    unless @workspace.admin?(current_user) || current_user.system_admin?
      render json: {
        success: false,
        message: '管理者権限が必要です'
      }, status: :forbidden
    end
  end

  def membership_params
    params.permit(:email, :role)
  end

  def membership_update_params
    params.permit(:role, :status)
  end
end
