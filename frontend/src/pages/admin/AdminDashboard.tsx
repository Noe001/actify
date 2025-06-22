import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity, 
  Shield, 
  Settings,
  UserPlus,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  UserCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { toast } from 'sonner';
import api from '@/services/api';
import MemberManagementTab from '@/components/admin/MemberManagementTab';

interface DashboardData {
  workspace: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    created_at: string;
    stats: {
      total_members: number;
      admin_count: number;
      department_count: number;
      active_tasks: number;
      completed_tasks: number;
      total_meetings: number;
      published_manuals: number;
    };
  };
  members: {
    total: number;
    admins: number;
    department_admins: number;
    members: number;
    recent_joins: number;
    by_department: Record<string, number>;
  };
  departments: Array<{
    name: string;
    member_count: number;
    admin_count: number;
    active_tasks: number;
  }>;
  activities: Array<{
    type: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    completion_rate: number;
  };
  meetings: {
    total: number;
    this_week: number;
    upcoming: number;
    average_duration: number;
  };
  attendance: {
    total_work_hours: number;
    average_work_hours: number;
    overtime_hours: number;
    attendance_rate: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { currentWorkspace, isWorkspaceAdmin, loading: workspaceLoading } = useWorkspace();
  const { user, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentWorkspace && isWorkspaceAdmin) {
      fetchDashboardData();
    }
  }, [currentWorkspace, isWorkspaceAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/dashboard?workspace_id=${currentWorkspace?.id}`);
      console.log('Dashboard API Response:', response.data); // デバッグ用
      setDashboardData(response.data.data); // response.data.dataを使用
    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error);
      toast.error('ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 認証状態やワークスペース情報の読み込み中
  if (authLoading || workspaceLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="container mx-auto py-8 flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">認証情報を確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 管理者権限がない場合
  if (!isWorkspaceAdmin) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">アクセス権限がありません</h2>
              <p className="text-muted-foreground">
                この機能は企業管理者のみ利用できます。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="container mx-auto py-8 flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
            <p className="text-muted-foreground">
              {currentWorkspace?.name} の管理と分析
            </p>
          </div>
          <Button onClick={fetchDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="members">メンバー管理</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
            <TabsTrigger value="security">セキュリティ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {!dashboardData ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">データを読み込み中...</p>
                </CardContent>
              </Card>
            ) : (
              <>
            {/* 企業概要 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  企業概要
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.workspace?.stats?.total_members || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">総メンバー数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.workspace?.stats?.department_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">部門数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData?.workspace?.stats?.active_tasks || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">アクティブタスク</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData?.workspace?.stats?.total_meetings || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">総ミーティング数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* メンバー統計 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総メンバー数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.members?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{dashboardData?.members?.recent_joins || 0} 今月の新規参加
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">タスク完了率</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.tasks?.completion_rate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.tasks?.completed || 0}/{dashboardData?.tasks?.total || 0} 完了
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">出勤率</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.attendance?.attendance_rate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    平均 {dashboardData?.attendance?.average_work_hours || 0}h/日
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">今週のミーティング</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.meetings?.this_week || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    平均 {dashboardData?.meetings?.average_duration || 0}時間
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 部門別統計 */}
            <Card>
              <CardHeader>
                <CardTitle>部門別統計</CardTitle>
                <CardDescription>各部門のメンバー数とアクティビティ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.departments?.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dept.member_count}名 • 管理者{dept.admin_count}名
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          アクティブタスク: {dept.active_tasks}
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            {/* 最近のアクティビティ */}
            <Card>
              <CardHeader>
                <CardTitle>最近のアクティビティ</CardTitle>
                <CardDescription>企業内の最新の活動</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.activities?.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'member_joined' && (
                          <UserPlus className="h-4 w-4 text-green-600" />
                        )}
                        {activity.type === 'task_completed' && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">{activity.details}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <MemberManagementTab workspaceId={currentWorkspace?.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>分析データ</CardTitle>
                <CardDescription>企業のパフォーマンス分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    分析機能は別途実装予定です
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>セキュリティ</CardTitle>
                <CardDescription>企業のセキュリティ状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    セキュリティ機能は別途実装予定です
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard; 
 