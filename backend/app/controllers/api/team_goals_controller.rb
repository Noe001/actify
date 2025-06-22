class Api::TeamGoalsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_team
  before_action :ensure_team_member
  before_action :set_goal, only: [:show, :update, :destroy, :update_progress, :update_kpi, :complete, :cancel, :pause, :resume]

  # GET /api/teams/:team_id/goals
  def index
    goals = @team.team_goals.not_archived.includes(:created_by, :last_updated_by)
    
    # フィルタリング
    goals = goals.by_status(params[:status]) if params[:status].present?
    goals = goals.by_type(params[:goal_type]) if params[:goal_type].present?
    goals = goals.by_category(params[:category]) if params[:category].present?
    goals = goals.by_priority(params[:priority]) if params[:priority].present?
    
    # 検索
    if params[:search].present?
      search_term = "%#{params[:search]}%"
      goals = goals.where("title ILIKE ? OR description ILIKE ?", search_term, search_term)
    end

    # ソート
    case params[:sort_by]
    when 'target_date'
      goals = goals.order(:target_date)
    when 'priority'
      goals = goals.order(
        Arel.sql("CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END")
      )
    when 'progress'
      goals = goals.order(progress_percentage: :desc)
    else
      goals = goals.recent
    end

    # ページネーション
    page = (params[:page] || 1).to_i
    per_page = [(params[:per_page] || 20).to_i, 100].min
    goals = goals.limit(per_page).offset((page - 1) * per_page)

    goals_data = goals.map(&:detailed_info)

    render json: {
      success: true,
      data: goals_data,
      meta: {
        page: page,
        per_page: per_page,
        total: @team.team_goals.not_archived.count,
        stats: TeamGoal.team_stats(@team)
      },
      message: '目標一覧を取得しました'
    }
  end

  # GET /api/teams/:team_id/goals/:id
  def show
    # 更新履歴も含めて取得
    updates = @goal.team_goal_updates.recent.includes(:updated_by).limit(10)
    
    render json: {
      success: true,
      data: @goal.detailed_info.merge(
        recent_updates: updates.map(&:detailed_info)
      ),
      message: '目標詳細を取得しました'
    }
  end

  # POST /api/teams/:team_id/goals
  def create
    # 権限チェック
    unless @team.can?(current_user, 'task', 'create') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を作成する権限がありません'
      }, status: :forbidden
      return
    end

    goal = @team.team_goals.build(goal_params)
    goal.created_by = current_user
    goal.last_updated_by = current_user
    goal.last_updated_at = Time.current

    if goal.save
      # チーム活動ログに記録
      TeamActivity.log_activity(
        team: @team,
        user: current_user,
        activity_type: 'goal_created',
        title: "新しい目標「#{goal.title}」を作成しました",
        description: goal.description&.truncate(100),
        target: goal
      )

      render json: {
        success: true,
        data: goal.detailed_info,
        message: '目標を作成しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: '目標の作成に失敗しました',
        errors: goal.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/teams/:team_id/goals/:id
  def update
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を更新する権限がありません'
      }, status: :forbidden
      return
    end

    if @goal.update(goal_params.merge(
      last_updated_by: current_user,
      last_updated_at: Time.current
    ))
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '目標を更新しました'
      }
    else
      render json: {
        success: false,
        message: '目標の更新に失敗しました',
        errors: @goal.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/teams/:team_id/goals/:id
  def destroy
    # 権限チェック
    unless @team.can?(current_user, 'task', 'delete') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を削除する権限がありません'
      }, status: :forbidden
      return
    end

    @goal.update!(is_archived: true)
    
    render json: {
      success: true,
      message: '目標をアーカイブしました'
    }
  end

  # POST /api/teams/:team_id/goals/:id/update_progress
  def update_progress
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '進捗を更新する権限がありません'
      }, status: :forbidden
      return
    end

    new_progress = params[:progress].to_i
    notes = params[:notes]

    if new_progress < 0 || new_progress > 100
      render json: {
        success: false,
        message: '進捗は0から100の間で入力してください'
      }, status: :unprocessable_entity
      return
    end

    begin
      @goal.update_progress(new_progress, current_user, notes)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '進捗を更新しました'
      }
    rescue => e
      render json: {
        success: false,
        message: '進捗の更新に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/teams/:team_id/goals/:id/update_kpi
  def update_kpi
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: 'KPIを更新する権限がありません'
      }, status: :forbidden
      return
    end

    if @goal.goal_type != 'kpi'
      render json: {
        success: false,
        message: 'KPIタイプの目標のみ更新可能です'
      }, status: :unprocessable_entity
      return
    end

    new_value = params[:current_value].to_f
    notes = params[:notes]

    begin
      @goal.update_current_value(new_value, current_user, notes)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: 'KPIを更新しました'
      }
    rescue => e
      render json: {
        success: false,
        message: 'KPIの更新に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/teams/:team_id/goals/:id/complete
  def complete
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を完了する権限がありません'
      }, status: :forbidden
      return
    end

    begin
      @goal.complete!(current_user)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '目標を完了しました'
      }
    rescue => e
      render json: {
        success: false,
        message: '目標の完了に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/teams/:team_id/goals/:id/cancel
  def cancel
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標をキャンセルする権限がありません'
      }, status: :forbidden
      return
    end

    reason = params[:reason]

    begin
      @goal.cancel!(current_user, reason)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '目標をキャンセルしました'
      }
    rescue => e
      render json: {
        success: false,
        message: '目標のキャンセルに失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/teams/:team_id/goals/:id/pause
  def pause
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を一時停止する権限がありません'
      }, status: :forbidden
      return
    end

    reason = params[:reason]

    begin
      @goal.pause!(current_user, reason)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '目標を一時停止しました'
      }
    rescue => e
      render json: {
        success: false,
        message: '目標の一時停止に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/teams/:team_id/goals/:id/resume
  def resume
    # 権限チェック
    unless @team.can?(current_user, 'task', 'update') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '目標を再開する権限がありません'
      }, status: :forbidden
      return
    end

    begin
      @goal.resume!(current_user)
      
      render json: {
        success: true,
        data: @goal.detailed_info,
        message: '目標を再開しました'
      }
    rescue => e
      render json: {
        success: false,
        message: '目標の再開に失敗しました',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # GET /api/teams/:team_id/goals/stats
  def stats
    # 権限チェック
    unless @team.can?(current_user, 'analytics', 'read') || @team.admin?(current_user)
      render json: {
        success: false,
        message: '統計情報を表示する権限がありません'
      }, status: :forbidden
      return
    end

    stats = TeamGoal.team_stats(@team)
    
    render json: {
      success: true,
      data: stats,
      message: '目標統計を取得しました'
    }
  end

  private

  def set_team
    @team = Team.find(params[:team_id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'チームが見つかりません'
    }, status: :not_found
  end

  def ensure_team_member
    unless @team.member?(current_user)
      render json: {
        success: false,
        message: 'チームメンバーのみアクセス可能です'
      }, status: :forbidden
    end
  end

  def set_goal
    @goal = @team.team_goals.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: '目標が見つかりません'
    }, status: :not_found
  end

  def goal_params
    params.require(:goal).permit(
      :title, :description, :goal_type, :category, :priority, :status,
      :target_value, :current_value, :unit, :measurement_method,
      :start_date, :target_date, :progress_percentage, :progress_notes,
      :tags
    )
  end
end 
