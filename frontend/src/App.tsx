import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 認証コンテキスト
import { AuthProvider } from './contexts/AuthContext';

  // テーマコンテキスト
  import { ThemeProvider } from './contexts/ThemeContext';
  
  // チームコンテキスト
  import { OrganizationProvider } from './contexts/OrganizationContext';

// ワークスペースコンテキスト
import { WorkspaceProvider } from './contexts/WorkspaceContext';
  
  // 認証が必要なルートのプロテクター
import ProtectedRoute from './components/ProtectedRoute';

// ビューのインポート
import LoginView from './pages/general/Login';
import SignupView from './pages/general/Signup';
import DashboardView from './pages/general/Dashboard';
import TaskManagerView from './pages/general/TaskManager';
import TeamChatView from './pages/general/TeamChat';
import MeetingView from './pages/general/Meeting';
import AttendanceView from './pages/general/Attendance';
import ManualView from './pages/general/Manual';
import ProfileView from './pages/general/Profile';
import WorkspaceSetup from './pages/general/WorkspaceSetup';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Toaster } from 'sonner';

const App = () => (
      <ThemeProvider>
    <AuthProvider>
      <WorkspaceProvider>
     <OrganizationProvider>
      <Router>
            <div className="App">
        <Routes>
                {/* 認証が不要なルート */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />
        
        {/* 企業セットアップ（認証は必要だが企業参加は不要） */}
        <Route path="/workspace-setup" element={
          <ProtectedRoute requireWorkspace={false} preventWorkspaceAccess={true}>
            <WorkspaceSetup />
          </ProtectedRoute>
        } />

        {/* 認証が必要なルート */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardView />
          </ProtectedRoute>
        } />
        
                
        
                {/* 管理者専用 */}
                <Route path="/admin/dashboard" element={
          <ProtectedRoute requireWorkspace={true}>
                    <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* タスク管理 */}
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TaskManagerView />
          </ProtectedRoute>
        } />
        
                {/* チームチャット */}
                <Route path="/chat" element={
          <ProtectedRoute>
            <TeamChatView />
          </ProtectedRoute>
        } />
                
                {/* ミーティング */}
                <Route path="/meetings" element={
                  <ProtectedRoute>
                    <MeetingView />
                  </ProtectedRoute>
                } />

        {/* 勤怠管理 */}
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendanceView />
          </ProtectedRoute>
        } />

        {/* マニュアル */}
                <Route path="/manuals" element={
          <ProtectedRoute>
            <ManualView />
          </ProtectedRoute>
        } />

        {/* プロフィール */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        } />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </div>
      </Router>
     </OrganizationProvider>
      </WorkspaceProvider>
    </AuthProvider>
    </ThemeProvider>
);

export default App;
