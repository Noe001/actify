import { ManualDepartmentOption, ManualCategoryOption, ManualAccessLevelOption, ManualEditPermissionOption } from '@/types/api';

// 部門選択肢
export const DEPARTMENTS: ManualDepartmentOption[] = [
  { value: 'sales', label: '営業部' },
  { value: 'dev', label: '開発部' },
  { value: 'hr', label: '人事部' },
];

// カテゴリー選択肢
export const CATEGORIES: ManualCategoryOption[] = [
  { value: 'procedure', label: '業務手順' },
  { value: 'rules', label: '規則・規定' },
  { value: 'system', label: 'システム操作' },
];

// アクセスレベル選択肢
export const ACCESS_LEVELS: ManualAccessLevelOption[] = [
  { value: 'all', label: '全社員' },
  { value: 'department', label: '部門内' },
  { value: 'specific', label: '指定メンバーのみ ⚠️ 仮実装' },
];

// 編集権限選択肢
export const EDIT_PERMISSIONS: ManualEditPermissionOption[] = [
  { value: 'author', label: '作成者のみ' },
  { value: 'department', label: '部門管理者' },
  { value: 'specific', label: '指定メンバー' },
];

// フィルターオプション
export const FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'my', label: '自分のマニュアル' },
  { value: 'published', label: '公開中' },
  { value: 'draft', label: '下書き' },
];

// ページネーション設定
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
};

// ユーティリティ関数
export const getDepartmentLabel = (value: string): string => {
  return DEPARTMENTS.find(d => d.value === value)?.label || value;
};

export const getCategoryLabel = (value: string): string => {
  return CATEGORIES.find(c => c.value === value)?.label || value;
};

export const getAccessLevelLabel = (value: string): string => {
  return ACCESS_LEVELS.find(a => a.value === value)?.label || value;
};

export const getEditPermissionLabel = (value: string): string => {
  return EDIT_PERMISSIONS.find(e => e.value === value)?.label || value;
};

export const getStatusLabel = (value: string): string => {
  switch (value) {
    case 'published':
      return '公開中';
    case 'draft':
      return '下書き';
    default:
      return value;
  }
};

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' => {
  return status === 'published' ? 'default' : 'secondary';
}; 
