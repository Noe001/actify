class Api::Admin::DashboardController < ApplicationController
  before_action :authenticate_user
  before_action :set_workspace
  before_action :ensure_admin_access

  # GET /api/admin/dashboard
  def index
    dashboard_data = {
      workspace: workspace_overview,
      members: members_overview,
      departments: departments_overview,
      activities: recent_activities,
      tasks: tasks_overview,
      meetings: meetings_overview,
      attendance: attendance_overview
    }

    render json: {
      success: true,
      data: dashboard_data,
      message: '管理者ダッシュボードデータを取得しました'
    }
  end

  # GET /api/admin/analytics
  def analytics
    analytics_data = {
      member_growth: member_growth_data,
      task_completion: task_completion_data,
      department_activity: department_activity_data,
      attendance_trends: attendance_trends_data,
      meeting_frequency: meeting_frequency_data
    }

    render json: {
      success: true,
      data: analytics_data,
      message: '分析データを取得しました'
    }
  end

  # GET /api/admin/security
  def security
    security_data = {
      login_attempts: recent_login_attempts,
      active_sessions: active_sessions_count,
      permission_changes: recent_permission_changes,
      data_access_logs: recent_data_access
    }

    render json: {
      success: true,
      data: security_data,
      message: 'セキュリティ情報を取得しました'
    }
  end

  private

  def set_workspace
    workspace_id = params[:workspace_id] || current_user.current_workspace&.id
    @workspace = Workspace.find(workspace_id) if workspace_id
    
    unless @workspace
      render json: {
        success: false,
        message: '企業が選択されていません'
      }, status: :bad_request
    end
  end

  def ensure_admin_access
    unless @workspace&.admin?(current_user) || current_user.system_admin?
      render json: {
        success: false,
        message: '管理者権限が必要です'
      }, status: :forbidden
    end
  end

  def workspace_overview
    {
      id: @workspace.id,
      name: @workspace.name,
      subdomain: @workspace.subdomain,
      status: @workspace.status,
      created_at: @workspace.created_at,
      stats: @workspace.stats
    }
  end

  def members_overview
    memberships = @workspace.workspace_memberships.active.includes(:user)
    
    {
      total: memberships.count,
      admins: memberships.admins.count,
      department_admins: memberships.department_admins.count,
      members: memberships.members.count,
      recent_joins: memberships.where('joined_at > ?', 30.days.ago).count,
      by_department: @workspace.department_member_counts
    }
  end

  def departments_overview
    departments = @workspace.departments
    
    departments.map do |dept|
      dept_members = @workspace.users.joins(:workspace_memberships)
                               .where(workspace_memberships: { status: 'active' })
                               .where(department: dept)
      
      {
        name: dept,
        member_count: dept_members.count,
        admin_count: dept_members.joins(:workspace_memberships)
                                .where(workspace_memberships: { role: ['admin', 'department_admin'] })
                                .count,
        active_tasks: @workspace.tasks.joins(:user)
                                .where(users: { department: dept })
                                .where(status: ['pending', 'in_progress'])
                                .count
      }
    end
  end

  def recent_activities
    # 最近30日間のアクティビティ
    activities = []
    
    # 新規メンバー参加
    recent_joins = @workspace.workspace_memberships
                            .where('joined_at > ?', 30.days.ago)
                            .includes(:user)
                            .order(joined_at: :desc)
                            .limit(10)
    
    recent_joins.each do |membership|
      activities << {
        type: 'member_joined',
        user: membership.user.name,
        timestamp: membership.joined_at,
        details: "#{membership.user.name}が企業に参加しました"
      }
    end
    
    # タスク完了
    completed_tasks = @workspace.tasks
                               .where('updated_at > ? AND status = ?', 7.days.ago, 'completed')
                               .includes(:user)
                               .order(updated_at: :desc)
                               .limit(10)
    
    completed_tasks.each do |task|
      activities << {
        type: 'task_completed',
        user: task.user&.name,
        timestamp: task.updated_at,
        details: "タスク「#{task.title}」が完了しました"
      }
    end
    
    activities.sort_by { |a| a[:timestamp] }.reverse.first(20)
  end

  def tasks_overview
    tasks = @workspace.tasks
    
    {
      total: tasks.count,
      pending: tasks.where(status: 'pending').count,
      in_progress: tasks.where(status: 'in_progress').count,
      completed: tasks.where(status: 'completed').count,
      overdue: tasks.where('due_date < ? AND status != ?', Date.current, 'completed').count,
      completion_rate: calculate_completion_rate(tasks)
    }
  end

  def meetings_overview
    meetings = @workspace.meetings
    
    {
      total: meetings.count,
      this_week: meetings.where('start_time >= ? AND start_time <= ?', 
                               Date.current.beginning_of_week, 
                               Date.current.end_of_week).count,
      upcoming: meetings.where('start_time > ?', Time.current).count,
      average_duration: calculate_average_meeting_duration(meetings)
    }
  end

  def attendance_overview
    current_month_start = Date.current.beginning_of_month
    current_month_end = Date.current.end_of_month
    
    attendances = @workspace.attendances
                           .where(date: current_month_start..current_month_end)
    
    {
      total_work_hours: attendances.sum(:total_hours),
      average_work_hours: attendances.average(:total_hours)&.round(2),
      overtime_hours: attendances.sum(:overtime_hours),
      attendance_rate: calculate_attendance_rate(attendances)
    }
  end

  def member_growth_data
    # 過去12ヶ月の月別メンバー増加数
    12.times.map do |i|
      month = i.months.ago.beginning_of_month
      month_end = month.end_of_month
      
      {
        month: month.strftime('%Y-%m'),
        new_members: @workspace.workspace_memberships
                              .where(joined_at: month..month_end)
                              .count,
        total_members: @workspace.workspace_memberships
                                .where('joined_at <= ?', month_end)
                                .where('left_at IS NULL OR left_at > ?', month_end)
                                .count
      }
    end.reverse
  end

  def task_completion_data
    # 過去30日間の日別タスク完了数
    30.times.map do |i|
      date = i.days.ago.to_date
      
      {
        date: date.strftime('%Y-%m-%d'),
        completed: @workspace.tasks
                            .where('DATE(updated_at) = ? AND status = ?', date, 'completed')
                            .count,
        created: @workspace.tasks
                          .where('DATE(created_at) = ?', date)
                          .count
      }
    end.reverse
  end

  def department_activity_data
    @workspace.departments.map do |dept|
      dept_users = @workspace.users.joins(:workspace_memberships)
                            .where(workspace_memberships: { status: 'active' })
                            .where(department: dept)
      
      {
        department: dept,
        task_completion_rate: calculate_department_task_completion_rate(dept),
        average_work_hours: calculate_department_average_work_hours(dept),
        meeting_participation: calculate_department_meeting_participation(dept)
      }
    end
  end

  def attendance_trends_data
    # 過去12週間の週別出勤率
    12.times.map do |i|
      week_start = i.weeks.ago.beginning_of_week
      week_end = week_start.end_of_week
      
      {
        week: week_start.strftime('%Y-W%U'),
        attendance_rate: calculate_weekly_attendance_rate(week_start, week_end),
        average_hours: calculate_weekly_average_hours(week_start, week_end)
      }
    end.reverse
  end

  def meeting_frequency_data
    # 過去6ヶ月の月別ミーティング数
    6.times.map do |i|
      month = i.months.ago.beginning_of_month
      month_end = month.end_of_month
      
      {
        month: month.strftime('%Y-%m'),
        meeting_count: @workspace.meetings
                                .where(start_time: month..month_end)
                                .count,
        average_participants: calculate_monthly_average_participants(month, month_end)
      }
    end.reverse
  end

  # ヘルパーメソッド
  def calculate_completion_rate(tasks)
    return 0 if tasks.count == 0
    (tasks.where(status: 'completed').count.to_f / tasks.count * 100).round(2)
  end

  def calculate_average_meeting_duration(meetings)
    durations = meetings.where.not(end_time: nil)
                       .pluck(:start_time, :end_time)
                       .map { |start, end_time| (end_time - start) / 1.hour }
    
    return 0 if durations.empty?
    (durations.sum / durations.count).round(2)
  end

  def calculate_attendance_rate(attendances)
    # 簡単な出勤率計算（実際の業務日数で割る）
    working_days = Date.current.beginning_of_month.upto(Date.current).count { |d| d.wday.between?(1, 5) }
    total_expected = @workspace.workspace_memberships.active.count * working_days
    
    return 0 if total_expected == 0
    (attendances.count.to_f / total_expected * 100).round(2)
  end

  def calculate_department_task_completion_rate(department)
    dept_tasks = @workspace.tasks.joins(:user)
                          .where(users: { department: department })
    
    calculate_completion_rate(dept_tasks)
  end

  def calculate_department_average_work_hours(department)
    current_month = Date.current.beginning_of_month..Date.current.end_of_month
    
    @workspace.attendances
              .joins(:user)
              .where(users: { department: department })
              .where(date: current_month)
              .average(:total_hours)&.round(2) || 0
  end

  def calculate_department_meeting_participation(department)
    dept_users = @workspace.users.joins(:workspace_memberships)
                          .where(workspace_memberships: { status: 'active' })
                          .where(department: department)
    
    total_meetings = @workspace.meetings.where('start_time > ?', 30.days.ago).count
    return 0 if total_meetings == 0
    
    participated_meetings = @workspace.meetings
                                    .joins(:meeting_participants)
                                    .where(meeting_participants: { user: dept_users })
                                    .where('meetings.start_time > ?', 30.days.ago)
                                    .distinct
                                    .count
    
    (participated_meetings.to_f / total_meetings * 100).round(2)
  end

  def calculate_weekly_attendance_rate(week_start, week_end)
    working_days = week_start.upto(week_end).count { |d| d.wday.between?(1, 5) }
    total_expected = @workspace.workspace_memberships.active.count * working_days
    
    return 0 if total_expected == 0
    
    actual_attendance = @workspace.attendances
                                 .where(date: week_start..week_end)
                                 .count
    
    (actual_attendance.to_f / total_expected * 100).round(2)
  end

  def calculate_weekly_average_hours(week_start, week_end)
    @workspace.attendances
              .where(date: week_start..week_end)
              .average(:total_hours)&.round(2) || 0
  end

  def calculate_monthly_average_participants(month_start, month_end)
    meetings = @workspace.meetings.where(start_time: month_start..month_end)
    return 0 if meetings.count == 0
    
    total_participants = meetings.joins(:meeting_participants).count
    (total_participants.to_f / meetings.count).round(2)
  end

  # セキュリティ関連のメソッド（実装例）
  def recent_login_attempts
    # 実際の実装では、ログインログテーブルから取得
    []
  end

  def active_sessions_count
    # 実際の実装では、セッションテーブルから取得
    @workspace.workspace_memberships.active.count
  end

  def recent_permission_changes
    # 実際の実装では、権限変更ログテーブルから取得
    []
  end

  def recent_data_access
    # 実際の実装では、アクセスログテーブルから取得
    []
  end
end 
