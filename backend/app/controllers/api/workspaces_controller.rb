class Api::WorkspacesController < ApplicationController
  before_action :authenticate_user
  before_action :set_workspace, only: [:show, :update, :destroy, :stats, :members, :add_member, :remove_member, :update_member_role]
  before_action :ensure_workspace_access, only: [:show, :stats, :members]
  before_action :ensure_workspace_admin, only: [:update, :destroy, :add_member, :remove_member, :update_member_role]

  # GET /api/workspaces
  def index
    @workspaces = current_user.workspaces.active.includes(:workspace_memberships)
    
    workspaces_data = @workspaces.map do |workspace|
      {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        subdomain: workspace.subdomain,
        status: workspace.status,
        is_public: workspace.is_public,
        logo_url: workspace.logo_url,
        primary_color: workspace.primary_color,
        accent_color: workspace.accent_color,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
        user_role: workspace.user_role(current_user),
        member_count: workspace.workspace_memberships.active.count
      }
    end
    
    render json: {
      success: true,
      data: workspaces_data,
      message: '企業一覧を取得しました'
    }
  end

  # GET /api/workspaces/:id
  def show
    workspace_data = {
      id: @workspace.id,
      name: @workspace.name,
      description: @workspace.description,
      subdomain: @workspace.subdomain,
      status: @workspace.status,
      is_public: @workspace.is_public,
      logo_url: @workspace.logo_url,
      primary_color: @workspace.primary_color,
      accent_color: @workspace.accent_color,
      settings: @workspace.settings,
      created_at: @workspace.created_at,
      updated_at: @workspace.updated_at,
      user_role: @workspace.user_role(current_user),
      departments: @workspace.departments,
      department_member_counts: @workspace.department_member_counts
    }
    
    render json: {
      success: true,
      data: workspace_data,
      message: '企業情報を取得しました'
    }
  end

  # POST /api/workspaces
  def create
    @workspace = current_user.create_workspace(
      workspace_params[:name],
      workspace_params[:subdomain],
      workspace_params[:description],
      {
        is_public: workspace_params[:is_public],
        primary_color: workspace_params[:primary_color],
        accent_color: workspace_params[:accent_color],
        logo_url: workspace_params[:logo_url]
      }
    )
    
    # 作成された企業の詳細情報を構築（管理者権限を含む）
    user_role = @workspace.user_role(current_user)
    Rails.logger.info "Workspace created: #{@workspace.id}, Creator role: #{user_role}"
    
    workspace_data = {
      id: @workspace.id,
      name: @workspace.name,
      description: @workspace.description,
      subdomain: @workspace.subdomain,
      status: @workspace.status,
      is_public: @workspace.is_public,
      logo_url: @workspace.logo_url,
      primary_color: @workspace.primary_color,
      accent_color: @workspace.accent_color,
      created_at: @workspace.created_at,
      updated_at: @workspace.updated_at,
      user_role: user_role, # 作成者の管理者権限を明示
      member_count: @workspace.workspace_memberships.active.count
    }
    
    render json: {
      success: true,
      data: workspace_data,
      message: '企業を作成しました'
    }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      success: false,
      message: '企業の作成に失敗しました',
      errors: e.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  # PATCH/PUT /api/workspaces/:id
  def update
    if @workspace.update(workspace_update_params)
      render json: {
        success: true,
        data: @workspace,
        message: '企業情報を更新しました'
      }
    else
      render json: {
        success: false,
        message: '企業情報の更新に失敗しました',
        errors: @workspace.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/workspaces/:id
  def destroy
    @workspace.archive!
    
    render json: {
      success: true,
      message: '企業をアーカイブしました'
    }
  end

  # GET /api/workspaces/:id/stats
  def stats
    stats_data = @workspace.stats
    
    render json: {
      success: true,
      data: stats_data,
      message: '企業統計を取得しました'
    }
  end

  # GET /api/workspaces/:id/members
  def members
    members = @workspace.users.joins(:workspace_memberships)
                      .where(workspace_memberships: { workspace: @workspace, status: 'active' })
                      .includes(:workspace_memberships)
                      .select('users.*, workspace_memberships.role, workspace_memberships.joined_at, workspace_memberships.last_activity_at')
    
    members_data = members.map do |user|
      membership = user.workspace_memberships.find { |m| m.workspace_id == @workspace.id }
      {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        role: membership.role,
        joined_at: membership.joined_at,
        last_activity_at: membership.last_activity_at,
        avatar_url: user.avatarUrl
      }
    end
    
    render json: {
      success: true,
      data: members_data,
      message: 'メンバー一覧を取得しました'
    }
  end

  # POST /api/workspaces/:id/members
  def add_member
    user = User.find_by(email: member_params[:email])
    
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
    
    @workspace.add_member(user, member_params[:role] || 'member')
    
    render json: {
      success: true,
      message: 'メンバーを追加しました'
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      success: false,
      message: 'メンバーの追加に失敗しました',
      errors: e.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  # DELETE /api/workspaces/:id/members/:user_id
  def remove_member
    user = User.find(params[:user_id])
    membership = @workspace.workspace_memberships.find_by(user: user, status: 'active')
    
    unless membership
      return render json: {
        success: false,
        message: 'このユーザーは企業のメンバーではありません'
      }, status: :not_found
    end
    
    # 最後の管理者は削除できない
    if membership.admin? && @workspace.workspace_memberships.admins.count == 1
      return render json: {
        success: false,
        message: '最後の管理者は削除できません'
      }, status: :unprocessable_entity
    end
    
    membership.deactivate!
    
    render json: {
      success: true,
      message: 'メンバーを削除しました'
    }
  end

  # PATCH /api/workspaces/:id/members/:user_id/role
  def update_member_role
    user = User.find(params[:user_id])
    membership = @workspace.workspace_memberships.find_by(user: user, status: 'active')
    
    unless membership
      return render json: {
        success: false,
        message: 'このユーザーは企業のメンバーではありません'
      }, status: :not_found
    end
    
    # 最後の管理者の権限は変更できない
    if membership.admin? && @workspace.workspace_memberships.admins.count == 1 && params[:role] != 'admin'
      return render json: {
        success: false,
        message: '最後の管理者の権限は変更できません'
      }, status: :unprocessable_entity
    end
    
    if membership.update(role: params[:role])
      render json: {
        success: true,
        message: 'メンバーの権限を更新しました'
      }
    else
      render json: {
        success: false,
        message: '権限の更新に失敗しました',
        errors: membership.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/workspaces/join
  def join
    workspace = Workspace.find_by(invite_code: params[:invite_code])
    
    unless workspace
      return render json: {
        success: false,
        message: '無効な招待コードです'
      }, status: :not_found
    end
    
    if workspace.member?(current_user)
      return render json: {
        success: false,
        message: '既にこの企業のメンバーです'
      }, status: :unprocessable_entity
    end
    
    workspace.add_member(current_user)
    
    # 参加後の企業情報を構築（ユーザー権限を含む）
    workspace_data = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      subdomain: workspace.subdomain,
      status: workspace.status,
      is_public: workspace.is_public,
      logo_url: workspace.logo_url,
      primary_color: workspace.primary_color,
      accent_color: workspace.accent_color,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      user_role: workspace.user_role(current_user), # 参加者の権限を明示
      member_count: workspace.workspace_memberships.active.count
    }
    
    render json: {
      success: true,
      data: workspace_data,
      message: '企業に参加しました'
    }
  end

  private

  def set_workspace
    @workspace = Workspace.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: '企業が見つかりません'
    }, status: :not_found
  end

  def ensure_workspace_access
    unless @workspace.accessible_by?(current_user)
      render json: {
        success: false,
        message: 'この企業にアクセスする権限がありません'
      }, status: :forbidden
    end
  end

  def ensure_workspace_admin
    unless @workspace.admin?(current_user) || current_user.system_admin?
      render json: {
        success: false,
        message: '管理者権限が必要です'
      }, status: :forbidden
    end
  end

  def workspace_params
    params.require(:workspace).permit(:name, :subdomain, :description, :is_public, :logo_url, :primary_color, :accent_color)
  end

  def workspace_update_params
    params.require(:workspace).permit(:name, :description, :is_public, :logo_url, :primary_color, :accent_color, settings: {})
  end

  def member_params
    params.permit(:email, :role)
  end
end 
