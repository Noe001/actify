import api from './api';

export interface Invitation {
  id: string;
  code: string;
  expires_at: string | null;
  created_by: string;
  uses_allowed: number | null;
  uses_count: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationRequest {
  expires_in?: number;
  uses_allowed?: number;
  permanent?: boolean;
}

export interface ValidateInvitationResponse {
  valid: boolean;
  error?: string;
  organization?: {
    id: string;
    name: string;
    description: string;
  };
}

const invitationService = {
  // チームの招待一覧を取得
  getOrganizationInvitations: async (organizationId: string): Promise<Invitation[]> => {
    const response = await api.get(`/api/organizations/${organizationId}/invitations`);
    return response.data as Invitation[];
  },

  // 招待の詳細を取得
  getInvitation: async (id: string): Promise<Invitation> => {
    const response = await api.get(`/api/invitations/${id}`);
    return response.data as Invitation;
  },

  // 新しい招待を作成
  createInvitation: async (organizationId: string, data: CreateInvitationRequest): Promise<Invitation> => {
    const response = await api.post(`/api/organizations/${organizationId}/invitations`, data);
    return response.data as Invitation;
  },

  // 招待を削除
  deleteInvitation: async (id: string): Promise<void> => {
    await api.delete(`/api/invitations/${id}`);
  },

  // 招待コードを検証
  validateInvitationCode: async (code: string): Promise<ValidateInvitationResponse> => {
    const response = await api.get(`/api/invitations/validate/${code}`);
    return response.data as ValidateInvitationResponse;
  },

  // 招待コードを使用してチームに参加
  useInvitationCode: async (code: string): Promise<any> => {
    const response = await api.post(`/api/invitations/use/${code}`);
    return response.data;
  }
};

export default invitationService; 
