import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import workspaceService, { Workspace } from '@/services/workspaceService';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  isWorkspaceAdmin: boolean;
  isWorkspaceDepartmentAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // 認証状態の変化を監視してワークスペース情報をリセット
  useEffect(() => {
    if (!isAuthenticated) {
      // ログアウト時は状態をリセット
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    // 認証済みの場合のみワークスペース情報を初期化
    const initializeWorkspaces = async () => {
      try {
        setLoading(true);
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        
        // ワークスペース一覧を取得
        const data = await workspaceService.getWorkspaces();
        const validWorkspaces = Array.isArray(data) ? data.filter(ws => ws && ws.name) : [];
        setWorkspaces(validWorkspaces);
        
        // 保存されたワークスペースIDがある場合、それを復元
        if (savedWorkspaceId && validWorkspaces.length > 0) {
          const savedWorkspace = validWorkspaces.find(ws => ws.id === savedWorkspaceId);
          if (savedWorkspace) {
            setCurrentWorkspaceState(savedWorkspace);
          } else if (validWorkspaces.length > 0) {
            // 保存されたワークスペースが見つからない場合、最初のワークスペースを選択
            setCurrentWorkspaceState(validWorkspaces[0]);
            localStorage.setItem('currentWorkspaceId', validWorkspaces[0].id);
          }
        } else if (validWorkspaces.length > 0) {
          // 保存されたワークスペースIDがない場合、最初のワークスペースを選択
          setCurrentWorkspaceState(validWorkspaces[0]);
          localStorage.setItem('currentWorkspaceId', validWorkspaces[0].id);
        }
      } catch (error) {
        console.error('ワークスペースの初期化に失敗しました:', error);
        setWorkspaces([]);
        setCurrentWorkspaceState(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeWorkspaces();
  }, [isAuthenticated]);

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
    }
  };

  const refreshWorkspaces = async () => {
    // 認証されていない場合は何もしない
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(Array.isArray(data) ? data : []);
      
      // 現在の企業が設定されていない場合、最初の企業を選択
      if (!currentWorkspace && Array.isArray(data) && data.length > 0 && data[0] && data[0].name) {
        setCurrentWorkspace(data[0]);
      }
    } catch (error) {
      console.error('企業の取得に失敗しました:', error);
      // エラー時は空配列を設定
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  // 現在のユーザーが企業管理者かどうか
  const isWorkspaceAdmin = currentWorkspace?.user_role === 'admin';

  // 現在のユーザーが部門管理者以上かどうか
  const isWorkspaceDepartmentAdmin = currentWorkspace?.user_role 
    ? ['admin', 'department_admin'].includes(currentWorkspace.user_role)
    : false;

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    loading,
    setCurrentWorkspace,
    refreshWorkspaces,
    isWorkspaceAdmin,
    isWorkspaceDepartmentAdmin,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}; 
