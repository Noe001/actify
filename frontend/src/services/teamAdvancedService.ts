import { api } from './api';

export interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_type: string;
  created_by: {
    id: string;
    name: string;
  };
  usage_count: number;
  rating: number;
  rating_count: number;
  tags: string[];
  is_featured: boolean;
  created_at: string;
}

export interface TeamRecognition {
  id: string;
  recognition_type: string;
  category: string;
  title: string;
  message: string;
  badge_name?: string;
  badge_color: string;
  badge_icon?: string;
  points_awarded: number;
  achievement_level?: string;
  is_public: boolean;
  is_featured: boolean;
  recipient: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  given_by: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface TeamHealthMetrics {
  id: string;
  measured_date: string;
  overall_health_score: number;
  engagement_score: number;
  collaboration_score: number;
  productivity_score: number;
  satisfaction_score: number;
  total_messages: number;
  active_users: number;
  tasks_completed: number;
  goals_achieved: number;
  recognitions_given: number;
  participation_rate: number;
  task_completion_rate: number;
  on_time_delivery_rate: number;
  calculated_at: string;
}

export interface CreateRecognitionData {
  recipient_id: string;
  recognition_type: string;
  category: string;
  title: string;
  message?: string;
  achievement_level?: string;
  badge_name?: string;
  badge_color?: string;
  badge_icon?: string;
  is_public?: boolean;
  related_resource_type?: string;
  related_resource_id?: string;
}

export interface CreateTeamFromTemplateData {
  template_id: string;
  team_name: string;
  team_description?: string;
}

// チームテンプレート関連
export const getTeamTemplates = async (params?: {
  category?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get('/teams/templates', { params });
  return response.data;
};

export const createTeamFromTemplate = async (data: CreateTeamFromTemplateData) => {
  const response = await api.post('/teams/create_from_template', data);
  return response.data;
};

// チーム表彰関連
export const getTeamRecognitions = async (teamId: string, params?: {
  type?: string;
  category?: string;
  recipient_id?: string;
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get(`/teams/${teamId}/recognitions`, { params });
  return response.data;
};

export const createTeamRecognition = async (teamId: string, data: CreateRecognitionData) => {
  const response = await api.post(`/teams/${teamId}/recognitions`, data);
  return response.data;
};

export const getRecognitionStats = async (teamId: string) => {
  const response = await api.get(`/teams/${teamId}/recognition_stats`);
  return response.data;
};

// チーム健康度関連
export const getTeamHealthMetrics = async (teamId: string, params?: {
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get(`/teams/${teamId}/health_metrics`, { params });
  return response.data;
};

export const calculateTeamHealth = async (teamId: string) => {
  const response = await api.post(`/teams/${teamId}/calculate_health`);
  return response.data;
};

// チームレポート関連
export const getTeamReport = async (teamId: string, reportType: string, format?: string) => {
  const response = await api.get(`/teams/${teamId}/reports`, {
    params: { report_type: reportType, format },
    responseType: format === 'csv' ? 'blob' : 'json'
  });
  return response.data;
};

// 外部統合関連
export const createExternalIntegration = async (teamId: string, data: {
  integration_type: string;
  config: Record<string, any>;
}) => {
  const response = await api.post(`/teams/${teamId}/external_integrations`, data);
  return response.data;
};

// チャット関連
export const getTeamChannels = async (teamId: string) => {
  const response = await api.get(`/teams/${teamId}/chat/channels`);
  return response.data;
};

export const createTeamChannel = async (teamId: string, data: {
  name: string;
  description?: string;
  channel_type: string;
}) => {
  const response = await api.post(`/teams/${teamId}/chat/channels`, { channel: data });
  return response.data;
};

export const getChannelMessages = async (teamId: string, channelId: string, params?: {
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get(`/teams/${teamId}/chat/channels/${channelId}/messages`, { params });
  return response.data;
};

export const sendMessage = async (teamId: string, channelId: string, data: {
  content: string;
  message_type?: string;
  files?: File[];
}) => {
  const formData = new FormData();
  formData.append('content', data.content);
  if (data.message_type) {
    formData.append('message_type', data.message_type);
  }
  if (data.files) {
    data.files.forEach(file => {
      formData.append('files[]', file);
    });
  }

  const response = await api.post(`/teams/${teamId}/chat/channels/${channelId}/messages`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const markChannelAsRead = async (teamId: string, channelId: string) => {
  const response = await api.post(`/teams/${teamId}/chat/channels/${channelId}/mark_read`);
  return response.data;
};

// 目標管理関連（新規APIエンドポイント用）
export const getTeamGoals = async (teamId: string, params?: {
  status?: string;
  goal_type?: string;
  category?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get(`/teams/${teamId}/goals`, { params });
  return response.data;
};

export const createTeamGoal = async (teamId: string, data: {
  title: string;
  description?: string;
  goal_type: string;
  category: string;
  priority: string;
  start_date: string;
  target_date: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  measurement_method?: string;
  tags?: string;
}) => {
  const response = await api.post(`/teams/${teamId}/goals`, { goal: data });
  return response.data;
};

export const updateTeamGoal = async (teamId: string, goalId: string, data: any) => {
  const response = await api.put(`/teams/${teamId}/goals/${goalId}`, { goal: data });
  return response.data;
};

export const updateGoalProgress = async (teamId: string, goalId: string, data: {
  progress: number;
  notes?: string;
}) => {
  const response = await api.post(`/teams/${teamId}/goals/${goalId}/update_progress`, data);
  return response.data;
};

export const updateGoalKPI = async (teamId: string, goalId: string, data: {
  current_value: number;
  notes?: string;
}) => {
  const response = await api.post(`/teams/${teamId}/goals/${goalId}/update_kpi`, data);
  return response.data;
};

export const completeGoal = async (teamId: string, goalId: string) => {
  const response = await api.post(`/teams/${teamId}/goals/${goalId}/complete`);
  return response.data;
};

export const cancelGoal = async (teamId: string, goalId: string, reason?: string) => {
  const response = await api.post(`/teams/${teamId}/goals/${goalId}/cancel`, { reason });
  return response.data;
};

export const getGoalStats = async (teamId: string) => {
  const response = await api.get(`/teams/${teamId}/goals/stats`);
  return response.data;
};

export default {
  // テンプレート
  getTeamTemplates,
  createTeamFromTemplate,
  
  // 表彰
  getTeamRecognitions,
  createTeamRecognition,
  getRecognitionStats,
  
  // 健康度
  getTeamHealthMetrics,
  calculateTeamHealth,
  
  // レポート
  getTeamReport,
  
  // 統合
  createExternalIntegration,
  
  // チャット
  getTeamChannels,
  createTeamChannel,
  getChannelMessages,
  sendMessage,
  markChannelAsRead,
  
  // 目標
  getTeamGoals,
  createTeamGoal,
  updateTeamGoal,
  updateGoalProgress,
  updateGoalKPI,
  completeGoal,
  cancelGoal,
  getGoalStats
}; 
