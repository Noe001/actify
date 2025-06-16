import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireWorkspace?: boolean;
  preventWorkspaceAccess?: boolean;
}

/**
 * 認証が必要なルートをラップするコンポーネント
 * 認証されていない場合はログインページにリダイレクト
 * 企業参加が必要な場合は企業セットアップページにリダイレクト
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireWorkspace = true,
  preventWorkspaceAccess = false
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading, workspaces } = useWorkspace();
  
  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">認証情報を確認中...</div>
      </div>
    );
  }

  // 未認証ならログインページへリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 企業セットアップページへのアクセス制御
  if (preventWorkspaceAccess) {
    // ワークスペース情報の読み込み中
    if (workspaceLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">企業情報を確認中...</div>
        </div>
      );
    }

    // 既に企業に参加している場合はダッシュボードにリダイレクト
    if (currentWorkspace && workspaces && workspaces.length > 0) {
      return <Navigate to="/" replace />;
    }
  }

  // 企業参加が必要な場合のチェック
  if (requireWorkspace) {
    // ワークスペース情報の読み込み中
    if (workspaceLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">企業情報を確認中...</div>
        </div>
      );
    }

    // 企業に参加していない場合は企業セットアップページへリダイレクト
    if (!currentWorkspace || !workspaces || workspaces.length === 0) {
      return <Navigate to="/workspace-setup" replace />;
    }
  }

  // 認証済み（かつ必要に応じて企業参加済み）なら子コンポーネントを表示
  return <>{children}</>;
};

export default ProtectedRoute; 
