class Api::TeamsController < ApplicationController
  before_action :authenticate_user
  before_action :set_workspace
  before_action :ensure_workspace_admin, except: [:index, :show]
  before_action :set_team, only: [:show, :update, :destroy, :add_member, :remove_member, :change_leader]

  # GET /api/teams
  def index
    teams = @workspace.teams.active.includes(:leader, :active_members)
    
    teams_data = teams.map do |team|
      begin
        team_stats = team.stats
        Rails.logger.info "Team stats calculated successfully for team #{team.id}"
      rescue => e
        Rails.logger.error "Error calculating stats for team #{team.id}: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        team_stats = { error: "統計情報の取得に失敗しました" }
      end

      {
        id: team.id,
        name: team.name,
        description: team.description,
        color: team.color,
        status: team.status,
        member_count: team.member_count,
        leader: team.leader ? {
          id: team.leader.id,
          name: team.leader.name,
          email: team.leader.email,
          avatar_url: team.leader.avatarUrl
        } : nil,
        created_at: team.created_at,
        updated_at: team.updated_at,
        stats: team_stats
      }
    end

    render json: {
      success: true,
      data: teams_data,
      message: 'チーム一覧を取得しました'
    }
  end

  # GET /api/teams/:id
  def show
    members_data = @team.active_memberships.includes(:user).map do |membership|
      {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        department: membership.user.department,
        position: membership.user.position,
        role: membership.role,
        joined_at: membership.joined_at,
        avatar_url: membership.user.avatarUrl
      }
    end

    team_data = {
      id: @team.id,
      name: @team.name,
      description: @team.description,
      color: @team.color,
      status: @team.status,
      member_count: @team.member_count,
      leader: @team.leader ? {
        id: @team.leader.id,
        name: @team.leader.name,
        email: @team.leader.email,
        avatar_url: @team.leader.avatarUrl
      } : nil,
      members: members_data,
      stats: @team.stats,
      created_at: @team.created_at,
      updated_at: @team.updated_at
    }

    render json: {
      success: true,
      data: team_data,
      message: 'チーム詳細を取得しました'
    }
  end

  # POST /api/teams
  def create
    team = @workspace.teams.build(team_params)
    
    if team.save
      # リーダーが指定されていればチームに追加
      if params[:leader_id].present?
        leader = @workspace.users.find(params[:leader_id])
        team.add_member(leader, 'leader')
        team.update!(leader: leader)
      end

      render json: {
        success: true,
        data: team,
        message: 'チームを作成しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: 'チームの作成に失敗しました',
        errors: team.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/teams/:id
  def update
    if @team.update(team_params)
      render json: {
        success: true,
        data: @team,
        message: 'チーム情報を更新しました'
      }
    else
      render json: {
        success: false,
        message: 'チーム情報の更新に失敗しました',
        errors: @team.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/teams/:id
  def destroy
    @team.archive!
    
    render json: {
      success: true,
      message: 'チームをアーカイブしました'
    }
  end



  # POST /api/teams/:id/members
  def add_member
    user = @workspace.users.find(params[:user_id])
    role = params[:role] || 'member'

    if @team.add_member(user, role, current_user)
      render json: {
        success: true,
        message: "#{user.name}をチームに追加しました"
      }
    else
      render json: {
        success: false,
        message: 'メンバーの追加に失敗しました'
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'ユーザーが見つかりません'
    }, status: :not_found
  end

  # DELETE /api/teams/:id/members/:user_id
  def remove_member
    user = @workspace.users.find(params[:user_id])

    if @team.remove_member(user, current_user)
      render json: {
        success: true,
        message: "#{user.name}をチームから削除しました"
      }
    else
      render json: {
        success: false,
        message: 'メンバーの削除に失敗しました'
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'ユーザーが見つかりません'
    }, status: :not_found
  end

  # PATCH /api/teams/:id/leader
  def change_leader
    new_leader = @workspace.users.find(params[:leader_id])

    if @team.change_leader(new_leader, current_user)
      render json: {
        success: true,
        message: "#{new_leader.name}をチームリーダーに設定しました"
      }
    else
      render json: {
        success: false,
        message: 'リーダーの変更に失敗しました'
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'ユーザーが見つかりません'
    }, status: :not_found
  end

  # GET /api/teams/:id/activities
  def activities
    activities = @team.team_activities
                      .includes(:user, :target)
                      .recent
                      .last_days(30)
                      .limit(50)
    
    activities_data = activities.map do |activity|
      {
        id: activity.id,
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        user: {
          id: activity.user.id,
          name: activity.user.name,
          avatar_url: activity.user.avatarUrl
        },
        target: activity.target ? {
          id: activity.target.id,
          type: activity.target.class.name,
          name: activity.target.respond_to?(:name) ? activity.target.name : activity.target.to_s
        } : nil,
        metadata: activity.metadata,
        occurred_at: activity.occurred_at,
        is_read: activity.is_read
      }
    end
    
    render json: {
      success: true,
      data: activities_data,
      message: 'チーム活動ログを取得しました'
    }
  end

  # POST /api/teams/:id/activities/:activity_id/mark_read
  def mark_activity_read
    activity = @team.team_activities.find(params[:activity_id])
    activity.mark_as_read!
    
    render json: {
      success: true,
      message: '活動を既読にしました'
    }
  end

  # GET /api/teams/:id/analytics
  def analytics
    period_days = (params[:period]&.to_i || 30).clamp(1, 365)
    
    analytics_data = @team.detailed_stats(period_days)
    
    render json: {
      success: true,
      data: analytics_data,
      message: 'チーム分析データを取得しました'
    }
  end

  # GET /api/teams/:id/performance
  def performance
    performance_data = @team.member_performance_analysis
    
    render json: {
      success: true,
      data: performance_data,
      message: 'メンバーパフォーマンス分析を取得しました'
    }
  end

  # GET /api/teams/:id/tasks
  def team_tasks
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    status_filter = params[:status]
    assigned_to_filter = params[:assigned_to]

    team_tasks = @team.tasks.includes(:user, :subtasks)

    # フィルタリング
    team_tasks = team_tasks.where(status: status_filter) if status_filter.present?
    team_tasks = team_tasks.where(assigned_to: assigned_to_filter) if assigned_to_filter.present?

    # ページネーション
    offset = (page - 1) * per_page
    total_count = team_tasks.count
    total_pages = (total_count.to_f / per_page).ceil
    paginated_tasks = team_tasks.offset(offset).limit(per_page).order(created_at: :desc)

    tasks_data = paginated_tasks.map do |task|
      {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        assigned_to: task.user ? {
          id: task.user.id,
          name: task.user.name,
          avatar_url: task.user.avatarUrl
        } : nil,
        subtasks_count: task.subtasks.count,
        completion_rate: task.subtasks_completion_rate,
        created_at: task.created_at,
        updated_at: task.updated_at
      }
    end

    render json: {
      success: true,
      data: tasks_data,
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      },
      message: 'チームタスク一覧を取得しました'
    }
  end

  private

  def set_workspace
    workspace_id = params[:workspace_id] || current_user.current_workspace&.id
    @workspace = Workspace.find(workspace_id) if workspace_id
    
    unless @workspace
      render json: {
        success: false,
        message: 'ワークスペースが選択されていません'
      }, status: :bad_request
    end
  end

  def ensure_workspace_admin
    unless @workspace&.admin?(current_user) || current_user.system_admin?
      render json: {
        success: false,
        message: '管理者権限が必要です'
      }, status: :forbidden
    end
  end

  def set_team
    @team = @workspace.teams.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'チームが見つかりません'
    }, status: :not_found
  end

  def team_params
    params.require(:team).permit(:name, :description, :color, :status)
  end
end 
 