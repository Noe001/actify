import api from './api';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  subdomain: string;
  status: string;
  is_public: boolean;
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_role?: string;
  member_count?: number;
  departments?: string[];
  department_member_counts?: Record<string, number>;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  role: string;
  joined_at: string;
  last_activity_at?: string;
  avatar_url?: string;
}

export interface WorkspaceStats {
  total_members: number;
  admin_count: number;
  department_count: number;
  active_tasks: number;
  completed_tasks: number;
  total_meetings: number;
  published_manuals: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  subdomain: string;
  description?: string;
  is_public?: boolean;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  settings?: Record<string, any>;
}

export interface JoinWorkspaceRequest {
  invite_code: string;
}

export interface AddMemberRequest {
  email: string;
  role?: string;
}

const workspaceService = {
  // 企業一覧を取得
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await api.get('/api/workspaces');
    return response.data.data as Workspace[];
  },

  // 企業の詳細を取得
  getWorkspace: async (id: string): Promise<Workspace> => {
    const response = await api.get(`/api/workspaces/${id}`);
    return response.data.data as Workspace;
  },

  // 新しい企業を作成
  createWorkspace: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.post('/api/workspaces', { workspace: data });
    return response.data.data as Workspace;
  },

  // 企業情報を更新
  updateWorkspace: async (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.patch(`/api/workspaces/${id}`, { workspace: data });
    return response.data.data as Workspace;
  },

  // 企業をアーカイブ
  deleteWorkspace: async (id: string): Promise<void> => {
    await api.delete(`/api/workspaces/${id}`);
  },

  // 企業に参加
  joinWorkspace: async (data: JoinWorkspaceRequest): Promise<Workspace> => {
    const response = await api.post('/api/workspaces/join', data);
    return response.data.data as Workspace;
  },

  // 企業統計を取得
  getWorkspaceStats: async (id: string): Promise<WorkspaceStats> => {
    const response = await api.get(`/api/workspaces/${id}/stats`);
    return response.data.data as WorkspaceStats;
  },

  // 企業メンバー一覧を取得
  getWorkspaceMembers: async (id: string): Promise<WorkspaceMember[]> => {
    const response = await api.get(`/api/workspaces/${id}/members`);
    return response.data.data as WorkspaceMember[];
  },

  // 企業メンバー一覧を取得（短縮形）
  getMembers: async (id: string): Promise<{ success: boolean; data: WorkspaceMember[]; message: string }> => {
    const response = await api.get(`/api/workspaces/${id}/members`);
    return response.data;
  },

  // メンバーを追加
  addMember: async (workspaceId: string, data: AddMemberRequest): Promise<void> => {
    await api.post(`/api/workspaces/${workspaceId}/add_member`, data);
  },

  // メンバーを削除
  removeMember: async (workspaceId: string, userId: string): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
  },

  // メンバーの権限を更新
  updateMemberRole: async (workspaceId: string, userId: string, role: string): Promise<void> => {
    await api.patch(`/api/workspaces/${workspaceId}/members/${userId}/role`, { role });
  },
};

export default workspaceService; 
