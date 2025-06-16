/**
 * APIレスポンスの基本的な型定義
 */

// API共通レスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  errors?: string[];
  timestamp?: string;
}

// エラーレスポンス型
export interface ApiError {
  message: string;
  code?: string;
  errors?: string[];
  timestamp?: string;
}

// ユーザー型
export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  display_name: string;
  profile_complete: boolean;
  paid_leave_balance: number;
  sick_leave_balance: number;
  monthly_work_hours: number;
  monthly_overtime_hours: number;
  created_at: string;
  updated_at: string;
  organizations?: OrganizationMembership[];
}

// チームメンバーシップ型
export interface OrganizationMembership {
  id: string;
  name: string;
  role: string;
}

// 認証レスポンス型
export interface AuthResponse {
  user: User;
  token: string;
}

// ログインリクエスト型
export interface LoginRequest {
  email: string;
  password: string;
}

// サインアップリクエスト型
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department?: string;
  position?: string;
  bio?: string;
}

// パスワード変更リクエスト型
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  password_confirmation: string;
}

// ページネーション型
export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  last_page: number; // react-paginateとの互換性のために追加
}

// ページネーション付きレスポンス型
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ミーティング関連の型
export interface Meeting {
  id: number;
  title: string;
  scheduledTime: string;
  participants: number;
  agenda: { topic: string; duration: number }[];
}

// タスク関連の型
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  organization_id?: string;
  parent_task_id?: string;  // 親タスクID
  created_at: string;
  updated_at: string;
  tags?: string | string[];  // タグ文字列またはタグ配列
  tag_list?: string | string[];  // タグリスト（APIによって返される形式が異なる場合）
  assignee_name?: string;
  is_overdue?: boolean;
  is_completed?: boolean;
  time_remaining?: number;
  subtasks?: Task[];  // サブタスク配列
}

// サブタスク関連の型（フロントエンドでのフォーム用）
export interface SubTask {
  id?: string | number;
  title: string;
  completed: boolean;
}

// マニュアル関連の型
export interface Manual {
  id: string;
  title: string;
  content: string;
  user_id: string;
  department: 'sales' | 'dev' | 'hr';
  category: 'procedure' | 'rules' | 'system';
  access_level: 'all' | 'department' | 'specific';
  edit_permission: 'author' | 'department' | 'specific';
  status: 'draft' | 'published';
  tags?: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
  };
  can_edit?: boolean;
}

// マニュアル部門の選択肢
export interface ManualDepartmentOption {
  value: 'sales' | 'dev' | 'hr';
  label: string;
}

// マニュアルカテゴリーの選択肢
export interface ManualCategoryOption {
  value: 'procedure' | 'rules' | 'system';
  label: string;
}

// マニュアルアクセスレベルの選択肢
export interface ManualAccessLevelOption {
  value: 'all' | 'department' | 'specific';
  label: string;
}

// マニュアル編集権限の選択肢
export interface ManualEditPermissionOption {
  value: 'author' | 'department' | 'specific';
  label: string;
}

// 勤怠管理関連の型
export interface Attendance {
  id: number;
  user_id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'good' | 'warning' | 'bad';
  score?: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  user_id: string;
  leave_type: 'paid' | 'sick' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  total_overtime: number;
  leave_balance: {
    paid: number;
    sick: number;
  };
}

// バックエンドのエラーコード定数（フロントエンド用）

// 認証エラーコード
export const AUTH_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_MALFORMED: 'TOKEN_MALFORMED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

// ログインエラーコード
export const LOGIN_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
} as const;

// パスワード変更エラーコード
export const PASSWORD_CHANGE_ERROR_CODES = {
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  CURRENT_PASSWORD_INVALID: 'CURRENT_PASSWORD_INVALID',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  UPDATE_FAILED: 'UPDATE_FAILED',
} as const;

// エラーコードの型定義
export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
export type LoginErrorCode = typeof LOGIN_ERROR_CODES[keyof typeof LOGIN_ERROR_CODES];
export type PasswordChangeErrorCode = typeof PASSWORD_CHANGE_ERROR_CODES[keyof typeof PASSWORD_CHANGE_ERROR_CODES];

// 全エラーコードの共用体型
export type ApiErrorCode = AuthErrorCode | LoginErrorCode | PasswordChangeErrorCode;

// エラーハンドリング用の型定義
export interface DetailedApiError extends ApiError {
  code: ApiErrorCode;
} 
