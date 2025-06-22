import api from './api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  member_count: number;
  leader?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  members?: TeamMember[];
  stats?: {
    total_members: number;
    active_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    total_tasks: number;
    completion_rate: number;
    recent_activities: number;
    total_channels: number;
    total_messages: number;
    messages_today: number;
    goals_stats: any;
  };
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  role: string;
  joined_at: string;
  avatar_url?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string;
  leader_id?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  color?: string;
  status?: string;
}

export interface AddMemberRequest {
  user_id: string;
  role?: string;
}

export interface TeamActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  target?: {
    id: string;
    type: string;
    name: string;
  };
  metadata: Record<string, any>;
  occurred_at: string;
  is_read: boolean;
}

export interface TeamAnalytics {
  basic_stats: {
    total_members: number;
    active_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    total_tasks: number;
    completion_rate: number;
    recent_activities: number;
  };
  productivity_metrics: {
    tasks_completed_this_period: number;
    average_task_completion_time: number;
    task_distribution_by_priority: Record<string, number>;
    member_task_distribution: {
      member_name: string;
      total_tasks: number;
      completed_tasks: number;
    }[];
  };
  collaboration_metrics: {
    total_activities: number;
    activity_by_type: Record<string, number>;
    most_active_members: {
      member_id: string;
      member_name: string;
      activity_count: number;
    }[];
    communication_frequency: number;
  };
  timeline_data: {
    daily_task_completion: {
      date: string;
      completed_tasks: number;
    }[];
    member_activity_timeline: {
      member: {
        id: string;
        name: string;
        avatar_url?: string;
      };
      recent_activities: {
        type: string;
        title: string;
        occurred_at: string;
      }[];
    }[];
  };
}

export interface MemberPerformance {
  member: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
    average_completion_time: number;
    recent_activities: number;
  };
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  subtasks_count: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  page?: number;
  per_page?: number;
  status?: string;
  assigned_to?: string;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

const teamService = {
  // チーム一覧を取得
  getTeams: async (workspaceId?: string): Promise<{ success: boolean; data: Team[]; message: string }> => {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await api.get('/api/teams', { params });
    return response.data;
  },

  // チーム詳細を取得
  getTeam: async (teamId: string): Promise<{ success: boolean; data: Team; message: string }> => {
    const response = await api.get(`/api/teams/${teamId}`);
    return response.data;
  },

  // チームを作成
  createTeam: async (teamData: CreateTeamRequest): Promise<{ success: boolean; data: Team; message: string }> => {
    const response = await api.post('/api/teams', { team: teamData, leader_id: teamData.leader_id });
    return response.data;
  },

  // チーム情報を更新
  updateTeam: async (teamId: string, teamData: UpdateTeamRequest): Promise<{ success: boolean; data: Team; message: string }> => {
    const response = await api.patch(`/api/teams/${teamId}`, { team: teamData });
    return response.data;
  },

  // チームを削除（アーカイブ）
  deleteTeam: async (teamId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/teams/${teamId}`);
    return response.data;
  },

  // チームにメンバーを追加
  addMember: async (teamId: string, memberData: AddMemberRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/teams/${teamId}/members`, memberData);
    return response.data;
  },

  // チームからメンバーを削除
  removeMember: async (teamId: string, userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  // チームリーダーを変更
  changeLeader: async (teamId: string, leaderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/api/teams/${teamId}/leader`, { leader_id: leaderId });
    return response.data;
  },

  // チーム活動ログを取得
  getActivities: async (teamId: string): Promise<{ success: boolean; data: TeamActivity[]; message: string }> => {
    const response = await api.get(`/api/teams/${teamId}/activities`);
    return response.data;
  },

  // 活動を既読にマーク
  markActivityRead: async (teamId: string, activityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/teams/${teamId}/activities/${activityId}/mark_read`);
    return response.data;
  },

  // チーム分析データを取得
  getAnalytics: async (teamId: string, period?: number): Promise<{ success: boolean; data: TeamAnalytics; message: string }> => {
    const params = period ? { period } : {};
    const response = await api.get(`/api/teams/${teamId}/analytics`, { params });
    return response.data;
  },

  // メンバーパフォーマンス分析を取得
  getPerformanceAnalysis: async (teamId: string): Promise<{ success: boolean; data: MemberPerformance[]; message: string }> => {
    const response = await api.get(`/api/teams/${teamId}/performance`);
    return response.data;
  },

  // チームタスク一覧を取得
  getTeamTasks: async (teamId: string, filters?: TaskFilters): Promise<{ success: boolean; data: TeamTask[]; meta: PaginationMeta; message: string }> => {
    const params = filters || {};
    const response = await api.get(`/api/teams/${teamId}/team_tasks`, { params });
    return response.data;
  },

  // チーム活動ログを取得
  getTeamActivities: async (teamId: string, params?: {
    page?: number;
    per_page?: number;
    activity_type?: string;
  }) => {
    const response = await api.get(`/teams/${teamId}/activities`, { params });
    return response.data;
  },

  // チーム分析データを取得
  getTeamAnalytics: async (teamId: string, periodDays: number = 30) => {
    const response = await api.get(`/teams/${teamId}/analytics`, {
      params: { period: periodDays }
    });
    return response.data;
  },

  // メンバーパフォーマンス分析を取得
  getTeamPerformance: async (teamId: string) => {
    const response = await api.get(`/teams/${teamId}/performance`);
    return response.data;
  },

  // 活動を既読にする
  markActivityAsRead: async (teamId: string, activityId: string) => {
    const response = await api.post(`/teams/${teamId}/activities/${activityId}/mark_read`);
    return response.data;
  },

  // チームタスクを取得
  getTeamTasks: async (teamId: string, params?: {
    page?: number;
    per_page?: number;
    status?: string;
    assigned_to?: string;
  }) => {
    const response = await api.get(`/teams/${teamId}/team_tasks`, { params });
    return response.data;
  }
};

export default teamService; 
 