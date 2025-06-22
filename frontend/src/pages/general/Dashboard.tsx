"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  FilePlus,
  BookOpen,
  Search,
  BarChart3,
  Calendar,
  Timer,
  Users,
  Edit,
  Trash2,
  Tag,
  Heart,
  MessageSquare,
  FileText,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from "lucide-react"
import Header from "@/components/Header"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { taskService, meetingService, attendanceService } from '@/services'
import { useApi } from '@/hooks'
import { Task } from '@/types/api'
import type { Meeting as ApiMeeting, Attendance } from '@/types/api'
import { ApiError, LoadingIndicator } from '@/components/ui'
import { getTaskProgress } from '@/services/taskService'
import { useAuth } from '@/contexts/AuthContext'
import { manualService } from '@/services'
import type { Manual } from '@/types/api'
import { getMarkdownPreview, renderMarkdown } from '@/utils/markdown'
import { toast } from "sonner"
import { 
  getDepartmentLabel, 
  getCategoryLabel,
  getStatusBadgeVariant 
} from '@/constants/manual'

// Meeting型定義
interface LocalMeeting {
  id: number
  title: string
  scheduledTime: string
  participants: number
  agenda: { topic: string; duration: number }[]
}

// DashboardTab Component
const DashboardTab: React.FC = () => {
  // タスク用のAPIフック
  const tasksApi = useApi<Task[]>();
  
  // ミーティング用のAPIフック
  const meetingsApi = useApi<ApiMeeting[]>();

  // 勤怠管理用のAPIフック
  const attendanceApi = useApi<Attendance>();

  // 認証コンテキストを使用
  const { user } = useAuth();

  // ユーザー名を取得
  const userName = user?.name || 'ゲスト';
  
  // 時間帯に基づくメッセージを生成
  const [greeting, setGreeting] = useState<string>('');
  const [taskCompletionRate, setTaskCompletionRate] = useState<number>(0);
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');

  // 時間帯に応じた挨拶を設定
  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting('おはようございます');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('こんにちは');
    } else {
      setGreeting('こんばんは');
    }
  }, []);

  // マニュアルのダミーデータ
  const manualItems: ManualTemplate[] = [
    {
      id: 1,
      title: "入社オリエンテーション資料",
      description: "新入社員向けの基本的な情報と手続きについて",
      sections: ["会社概要", "チーム構造", "基本的な業務プロセス", "行動規範", "福利厚生"],
      createdAt: "2023-05-10",
      tags: ["新入社員", "オリエンテーション", "入門"],
    },
    {
      id: 2,
      title: "営業プロセスガイド",
      description: "見込み客の獲得から契約までの標準的な営業フロー",
      sections: ["見込み客リサーチ", "初回アプローチ", "提案資料作成", "価格交渉", "クロージング"],
      createdAt: "2023-06-15",
      tags: ["営業", "プロセス", "顧客"],
    },
    {
      id: 3,
      title: "カスタマーサポート対応マニュアル",
      description: "お客様からの問い合わせに対する標準的な対応手順",
      sections: ["初期対応", "事実確認", "謝罪と解決策提示", "フォローアップ", "再発防止策"],
      createdAt: "2023-07-20",
      tags: ["サポート", "顧客対応", "手順", "トラブルシューティング"],
    },
  ];

  // タスクの完了率を計算
  useEffect(() => {
    if (tasksApi.data && tasksApi.data.length > 0) {
      const completedTasks = tasksApi.data.filter(task => task.status === 'completed').length;
      const totalTasks = tasksApi.data.length;
      const completionRate = Math.round((completedTasks / totalTasks) * 100);
      setTaskCompletionRate(completionRate);
      
      // タスク完了率に基づくメッセージを設定
      if (completionRate >= 90) {
        setMotivationalMessage('素晴らしい進捗です！目標達成まであと少しです。');
      } else if (completionRate >= 70) {
        setMotivationalMessage('順調に進んでいます。このペースを維持しましょう。');
      } else if (completionRate >= 50) {
        setMotivationalMessage('半分以上完了しました。次の目標に向けて頑張りましょう。');
      } else if (completionRate >= 30) {
        setMotivationalMessage('一歩ずつ着実に進んでいます。焦らず取り組みましょう。');
      } else {
        setMotivationalMessage('新しい週の始まりです。一つずつ着実に進めていきましょう。');
      }
    } else {
      setTaskCompletionRate(0);
      setMotivationalMessage('新しいタスクを作成して、生産性を高めましょう。');
    }
  }, [tasksApi.data]);

  // チームアクティビティ
  const teamActivities = [
    { user: "佐藤太郎", activity: "タスク「プレゼン資料作成」を完了しました", time: "1時間前" },
    { user: "鈴木花子", activity: "新しいナレッジ「効率的な会議の進め方」を追加しました", time: "3時間前" },
    { user: "田中誠", activity: "チームチャットで新しい投稿をしました", time: "昨日" },
  ]

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    // 自分のタスクを取得
    tasksApi.execute(
      () => taskService.getMyTasks()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'タスクの取得に失敗しました');
        })
    );
    
    // 自分の参加するミーティングを取得
    meetingsApi.execute(
      () => meetingService.getMyMeetings()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'ミーティングの取得に失敗しました');
        })
    );

    // 勤怠データを取得
    attendanceApi.execute(
      () => attendanceService.getAttendance()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || '勤怠データの取得に失敗しました');
        })
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* ようこそメッセージ */}
      <Card className="bg-gradient-to-r from-card to-muted/50 border-border shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-foreground">{greeting}、{userName}さん</h2>
          <p className="text-muted-foreground mb-4">{motivationalMessage} 今週のタスク完了率は{taskCompletionRate}%です。</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link to="/tasks">
                <FileText className="h-4 w-4 mr-2" />
                タスク
              </Link>
            </Button>
            <Button variant="secondary" className="shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link to="/attendance">
                <Calendar className="h-4 w-4 mr-2" />
                勤怠管理
              </Link>
            </Button>
            <Button variant="secondary" className="shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link to="/team_chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                メッセージ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manuals Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>業務マニュアル</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manualItems.map((manual) => (
                <Card key={manual.id} className="cursor-pointer hover:shadow-md transition-shadow bg-muted/40">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{manual.title}</span>
                      {/* TODO: マニュアル詳細へのリンクや編集・削除ボタン */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{manual.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {manual.tags.map((tag, index) => (
                        <span key={index} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクセスとステータス */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              業務進捗
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksApi.loading && (
              <LoadingIndicator text="タスクを読込中..." size="sm" />
            )}
            
            {tasksApi.error && (
              <ApiError 
                error={tasksApi.error}
                onRetry={() => tasksApi.execute(() => taskService.getMyTasks().then(res => res.success ? res.data : []))}
              />
            )}
            
            {!tasksApi.loading && !tasksApi.error && tasksApi.data && (
              <div className="space-y-4">
                {tasksApi.data.filter(task => task.status !== 'completed').length > 0 ? (
                  tasksApi.data
                    .filter(task => task.status !== 'completed')
                    .sort((a, b) => {
                      // サブタスクを持つタスクを優先
                      const aHasSubtasks = a.subtasks && a.subtasks.length > 0;
                      const bHasSubtasks = b.subtasks && b.subtasks.length > 0;
                      
                      if (aHasSubtasks && !bHasSubtasks) return -1;
                      if (!aHasSubtasks && bHasSubtasks) return 1;
                      return 0;
                    })
                    .slice(0, 3)
                    .map((task) => {
                      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                      
                      return (
                        <div key={task.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="max-w-[65%] truncate" title={task.title}>{task.title}</span>
                            {hasSubtasks ? (
                              <span>
                                {getTaskProgress(task)}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                サブタスク未作成
                              </span>
                            )}
                          </div>
                          {hasSubtasks ? (
                            <Progress 
                              value={getTaskProgress(task)} 
                              className="h-2"
                            />
                          ) : (
                            <div className="h-1 rounded-full bg-muted"></div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center text-muted-foreground">進行中のタスクがありません</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/tasks">タスク一覧</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              本日の会議
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetingsApi.loading && (
              <LoadingIndicator text="会議を読込中..." size="sm" />
            )}
            
            {meetingsApi.error && (
              <ApiError 
                error={meetingsApi.error}
                onRetry={() => meetingsApi.execute(() => meetingService.getMyMeetings().then(res => res.success ? res.data : []))}
              />
            )}
            
            {!meetingsApi.loading && !meetingsApi.error && meetingsApi.data && (
              <div className="space-y-4">
                {meetingsApi.data.length > 0 ? (
                  meetingsApi.data.slice(0, 3).map((meeting) => {
                    // 日付と時間を変換
                    const meetingDate = new Date(meeting.scheduledTime);
                    const timeString = meetingDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    // 会議時間（仮の実装）
                    const duration = meeting.agenda && meeting.agenda.length > 0
                      ? meeting.agenda.reduce((total, item) => total + item.duration, 0)
                      : 30; // デフォルト30分
                      
                    return (
                      <div key={meeting.id} className="flex justify-between items-center p-2 border rounded bg-muted/40">
                        <div>
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-muted-foreground">{timeString}</div>
                        </div>
                        <div className="text-sm">{duration}分</div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground">今日の会議はありません</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/meeting">会議スケジュール</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              勤怠管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {attendanceApi.loading && (
              <LoadingIndicator text="データを読込中..." size="sm" />
            )}
            
            {attendanceApi.error && (
              <ApiError 
                error={attendanceApi.error}
                onRetry={() => attendanceApi.execute(() => 
                  attendanceService.getAttendance()
                    .then(res => res.success ? res.data : null)
                )}
              />
            )}
            
            {!attendanceApi.loading && !attendanceApi.error && attendanceApi.data && (
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted-foreground/20"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={
                        attendanceApi.data.status === 'good' 
                          ? "text-teal-primary" 
                          : attendanceApi.data.status === 'warning' 
                            ? "text-teal-secondary" 
                            : "text-red-500"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${((attendanceApi.data.score || 0) / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${
                      attendanceApi.data.status === 'good' 
                        ? "text-teal-primary" 
                        : attendanceApi.data.status === 'warning' 
                          ? "text-teal-secondary" 
                          : "text-red-500"
                    }`}>
                      {attendanceApi.data.score || 0}
                    </span>
                  </div>
                </div>
                <Badge 
                  className={
                    attendanceApi.data.status === 'good' 
                      ? "bg-teal-100 text-teal-800" 
                      : attendanceApi.data.status === 'warning' 
                        ? "bg-teal-200 text-teal-700" 
                        : "bg-red-100 text-red-800"
                  }
                >
                  {attendanceApi.data.status === 'good' ? '良好' : 
                   attendanceApi.data.status === 'warning' ? '要注意' : '改善が必要'}
                </Badge>
                <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                  <Link to="/attendance">詳細を見る</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              チームアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[150px] overflow-y-auto">
              {teamActivities.map((activity, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-muted-foreground">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/team_chat">チームチャットへ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 lg:col-span-4 bg-muted/40">
          <CardHeader>
            <CardTitle>クイックアクセス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: FileText, label: "マニュアル作成", path: "/manual" },
                { icon: Timer, label: "会議作成", path: "/meeting" },
                { icon: BookOpen, label: "ナレッジ作成", path: "/knowledge_base" },
                { icon: MessageSquare, label: "チャット", path: "/team_chat" },
                { icon: CheckSquare, label: "タスク管理", path: "/tasks" },
                { icon: Heart, label: "勤怠管理", path: "/attendance" },
              ].map(({ icon: Icon, label, path }, index) => (
                <Button key={index} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <Link to={path}>
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ManualsTab Component
const ManualsTab: React.FC = () => {
  const navigate = useNavigate();
  const [recentManuals, setRecentManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    myManuals: 0
  });
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<Manual | null>(null);
  const [isMetaVisible, setIsMetaVisible] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manual[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // マニュアル統計とダッシュボード情報を取得
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 最近のマニュアルと統計情報を並列取得
      const [manualsResponse, statsResponse] = await Promise.all([
        manualService.getManuals({ page: 1, per_page: 5 }),
        manualService.getStats()
      ]);
      
      // 最近のマニュアルを設定
      if (manualsResponse.success && manualsResponse.data) {
        setRecentManuals(manualsResponse.data.data);
      }
        
      // 統計情報を設定
      if (statsResponse.success && statsResponse.data) {
          setStats({
          total: statsResponse.data.total,
          published: statsResponse.data.published,
          drafts: statsResponse.data.drafts,
          myManuals: statsResponse.data.my_manuals
          });
      }
    } catch (error: any) {
      console.error('ダッシュボードデータの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // マニュアル削除
  const handleDelete = async (manual: Manual) => {
    try {
      await manualService.deleteManual(manual.id);
      toast.success('マニュアルを削除しました');
      setIsDeleteDialogOpen(false);
      setSelectedManual(null); // 詳細ポップアップも閉じる
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // マニュアル検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // サーバーサイドの検索APIを使用（全マニュアルを対象とした検索）
      const response = await manualService.searchManuals({
        query: searchQuery.trim(),
        status: 'published', // 公開済みマニュアルのみ検索
        page: 1,
        per_page: 20, // 検索結果は多めに表示
        order_by: 'updated_at',
        order: 'desc'
      });
      
      if (response.success && response.data) {
        setSearchResults(response.data.data || []);
      } else {
        setSearchResults([]);
        if (!response.success && response.message) {
          toast.error(response.message);
        }
      }
    } catch (error: any) {
      toast.error('検索に失敗しました');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // 検索クエリ変更時の処理（デバウンス付き）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms のデバウンス
    
    return () => clearTimeout(timer);
  }, [searchQuery]);



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>業務マニュアル</span>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to="/manual">
                <BookOpen className="mr-2 h-4 w-4" />
                すべて表示
              </Link>
            </Button>
            <Button asChild>
              <Link to="/manual/create">
                <FilePlus className="mr-2 h-4 w-4" />
                新規作成
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-muted/40"
              onClick={() => navigate('/manual?status=all')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">総マニュアル数</div>
              </div>
            </Card>
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-muted/40"
              onClick={() => navigate('/manual?status=published')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.published}</div>
                <div className="text-sm text-muted-foreground">公開中</div>
              </div>
            </Card>
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-muted/40"
              onClick={() => navigate('/manual?status=draft')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.drafts}</div>
                <div className="text-sm text-muted-foreground">下書き</div>
              </div>
            </Card>
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-muted/40"
              onClick={() => navigate('/manual?status=my')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.myManuals}</div>
                <div className="text-sm text-muted-foreground">自分のマニュアル</div>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">最近のマニュアル</h3>
            {loading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : recentManuals.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">まだマニュアルがありません</p>
                <Button asChild>
                  <Link to="/manual/create">
                    <FilePlus className="mr-2 h-4 w-4" />
                    最初のマニュアルを作成
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentManuals.slice(0, 5).map((manual) => (
                  <Card key={manual.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-muted/40" onClick={() => {
                    setSelectedManual(manual);
                    setIsMetaVisible(true);
                  }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{manual.title}</h4>
                          <Badge variant={getStatusBadgeVariant(manual.status)}>
                            {manual.status === 'published' ? '公開中' : '下書き'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {getDepartmentLabel(manual.department)}
                          </span>
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {getCategoryLabel(manual.category)}
                          </span>
                          {manual.author && (
                            <span>作成者: {manual.author.name}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {getMarkdownPreview(manual.content || '', 100)}
                        </p>
                      </div>

                    </div>
                  </Card>
                ))}
                
                {/* すべて表示リンク */}
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/manual">
                      すべてのマニュアルを表示
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">アクション</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 hover:shadow-md transition-shadow cursor-pointer border rounded-lg bg-muted/40">
                <Link to="/manual/create" className="block">
                  <div className="text-center">
                    <FilePlus className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">新規作成</div>
                    <div className="text-sm text-muted-foreground">新しいマニュアルを作成</div>
                  </div>
                </Link>
              </div>
              <div 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border rounded-lg bg-muted/40"
                onClick={() => setIsSearchModalOpen(true)}
              >
                  <div className="text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">クイック検索</div>
                  <div className="text-sm text-muted-foreground">マニュアルを素早く検索</div>
                  </div>
              </div>
              <div 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border rounded-lg bg-muted/40"
                onClick={() => setIsStatsModalOpen(true)}
              >
                  <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">詳細統計</div>
                  <div className="text-sm text-muted-foreground">詳細な統計情報</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* マニュアル詳細表示ダイアログ */}
      <Dialog open={!!selectedManual} onOpenChange={() => setSelectedManual(null)}>
        <DialogContent 
          className="max-w-5xl max-h-[90vh] p-0 flex flex-col"
          aria-describedby={selectedManual ? `manual-description-${selectedManual.id}` : undefined}
        >
          {selectedManual && (
            <>
              {/* ヘッダー部分 */}
                              <div className="bg-muted/30 p-6 border-b flex-shrink-0">
                  <DialogHeader className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <DialogTitle 
                        className="text-3xl font-bold text-foreground leading-tight"
                      >
                        {selectedManual.title}
                      </DialogTitle>
                      {selectedManual.created_at && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(selectedManual.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                    
                    <DialogDescription className="sr-only">
                      {selectedManual.title}のマニュアル詳細を表示しています。
                    </DialogDescription>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={getStatusBadgeVariant(selectedManual.status)}
                        className="text-xs font-medium px-3 py-1 flex-shrink-0"
                      >
                        {selectedManual.status === 'published' ? '公開中' : '下書き'}
                      </Badge>
                    </div>
                    {selectedManual.can_edit && (
                      <div className="flex items-center space-x-2 mr-12">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/manual/edit/${selectedManual.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManualToDelete(selectedManual);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          削除
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* メタ情報トグルボタン（モバイルのみ表示） */}
                  <div className="md:hidden mt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                      onClick={() => setIsMetaVisible(!isMetaVisible)}
                    >
                      <span className="text-sm text-muted-foreground">詳細情報</span>
                      {isMetaVisible ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* メタ情報グリッド */}
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 transition-all duration-300 overflow-hidden ${
                    isMetaVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
                  }`}>
                    <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                      <div className="bg-primary/5 p-2 rounded-full">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">部門</div>
                        <div className="text-sm font-semibold text-foreground">
                          {getDepartmentLabel(selectedManual.department)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                      <div className="bg-secondary/60 p-2 rounded-full">
                        <Tag className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">カテゴリー</div>
                        <div className="text-sm font-semibold text-foreground">
                          {getCategoryLabel(selectedManual.category)}
                        </div>
                      </div>
                    </div>
                    
                    {selectedManual.author && (
                      <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                        <div className="bg-accent/60 p-2 rounded-full">
                          <FileText className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-medium">作成者</div>
                          <div className="text-sm font-semibold text-foreground">
                            {selectedManual.author.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* タグ表示 */}
                  {selectedManual.tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedManual.tags.split(',').map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="bg-background/80 text-foreground border"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </DialogHeader>
              </div>

              {/* コンテンツ部分 */}
              <div 
                id={`manual-description-${selectedManual.id}`}
                className="flex-1 overflow-y-auto p-6 bg-background min-h-0"
              >
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground [&_h1]:text-[1.75rem] [&_h2]:text-2xl [&_h3]:text-xl [&_h4]:text-base [&_p]:my-0.5 [&_h1]:mb-1 [&_h2]:mb-1 [&_h2]:mt-0.5 [&_h3]:mb-0.5 [&_h4]:mb-0.5 [&_h5]:mb-0.5 [&_h6]:mb-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_blockquote]:my-1 [&_h1]:border-b [&_h1]:border-gray-300 [&_h1]:pb-1">
                  {selectedManual.content ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdown(selectedManual.content) 
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground italic">
                          内容がありません
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent aria-describedby="delete-dialog-description">
          <DialogHeader>
            <DialogTitle>マニュアルの削除</DialogTitle>
            <DialogDescription id="delete-dialog-description">
              「{manualToDelete?.title}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => manualToDelete && handleDelete(manualToDelete)}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* クイック検索モーダル */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>マニュアル検索</DialogTitle>
            <DialogDescription>
              全マニュアルを対象にタイトルや内容から検索できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="検索キーワードを入力..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                検索
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">検索中...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground px-1 mb-2">
                    {searchResults.length}件のマニュアルが見つかりました
                  </div>
                  {searchResults.map((manual) => (
                    <Card key={manual.id} className="p-3 cursor-pointer hover:shadow-md bg-muted/40" onClick={() => {
                      setSelectedManual(manual);
                      setIsSearchModalOpen(false);
                      setIsMetaVisible(true);
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{manual.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getDepartmentLabel(manual.department)} - {getCategoryLabel(manual.category)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            作成者: {manual.author?.name || '不明'} · {new Date(manual.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(manual.status)}>
                          {manual.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </>
              ) : searchQuery ? (
                <p className="text-center text-muted-foreground py-4">
                  「{searchQuery}」に一致するマニュアルが見つかりません
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  検索キーワードを入力してください
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 詳細統計モーダル */}
      <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>マニュアル詳細統計</DialogTitle>
            <DialogDescription>
              マニュアルの詳細な統計情報
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">総マニュアル数</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-primary">{stats.published}</div>
                <div className="text-sm text-muted-foreground">公開中</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.drafts}</div>
                <div className="text-sm text-muted-foreground">下書き</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-secondary">{stats.myManuals}</div>
                <div className="text-sm text-muted-foreground">自分のマニュアル</div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">公開率</h4>
              <Progress 
                value={stats.total > 0 ? (stats.published / stats.total) * 100 : 0} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% のマニュアルが公開されています
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </Card>
  )
}

// KnowledgeTab Component
const KnowledgeTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null)
  const [sortOrder, setSortOrder] = useState<string>("title")

  const knowledgeCategories: KnowledgeCategory[] = [
    { id: 1, name: "業務プロセス" },
    { id: 2, name: "顧客対応" },
    { id: 3, name: "システム操作" },
    { id: 4, name: "技術情報" },
  ]

  const knowledgeItems: KnowledgeItem[] = [
    {
      id: 1,
      title: "新規顧客対応マニュアル",
      category: "顧客対応",
      description: "初回面談から契約までの標準的な顧客対応プロセス",
      tags: ["営業", "顧客", "接客"],
      createdAt: "2023-05-15",
    },
    {
      id: 2,
      title: "CRMシステム利用ガイド",
      category: "システム操作",
      description: "社内CRMシステムの基本操作と効率的な活用方法",
      tags: ["システム", "CRM", "トレーニング"],
      createdAt: "2023-06-20",
    },
    {
      id: 3,
      title: "新プロジェクト立ち上げ手順",
      category: "業務プロセス",
      description: "新規プロジェクトの計画から実行までの標準フロー",
      tags: ["プロジェクト管理", "業務"],
      createdAt: "2023-07-25",
    },
  ]

  const filteredAndSortedKnowledge = knowledgeItems
    .filter(
      (item) =>
        (selectedCategory ? item.category === selectedCategory : true) &&
        (searchTerm
          ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          : true),
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "title":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        case "category":
          return a.category.localeCompare(b.category);
        case "categoryDesc":
          return b.category.localeCompare(a.category);
        case "createdAt":
          return a.createdAt.localeCompare(b.createdAt);
        case "createdAtDesc":
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return 0;
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>ナレッジベース</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ナレッジを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <Label>ソート</Label>
                  <Select defaultValue="title" value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="ソート順" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">タイトル (昇順)</SelectItem>
                      <SelectItem value="titleDesc">タイトル (降順)</SelectItem>
                      <SelectItem value="category">カテゴリ (昇順)</SelectItem>
                      <SelectItem value="categoryDesc">カテゴリ (降順)</SelectItem>
                      <SelectItem value="createdAt">作成日 (昇順)</SelectItem>
                      <SelectItem value="createdAtDesc">作成日 (降順)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild>
              <Link to="/knowledge_base">
                <FilePlus className="mr-2 h-4 w-4" />
                新規作成
              </Link>
            </Button>
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            {knowledgeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </Button>
            ))}
            <Button variant={selectedCategory === "" ? "default" : "outline"} onClick={() => setSelectedCategory("")}>
              すべて
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedKnowledge.map((knowledge) => (
              <Card key={knowledge.id} className="cursor-pointer hover:shadow-md transition-shadow bg-muted/40">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{knowledge.title}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{knowledge.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {knowledge.tags.map((tag, index) => (
                      <span key={index} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedKnowledge} onOpenChange={() => setSelectedKnowledge(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedKnowledge?.title}</DialogTitle>
                <DialogDescription>ナレッジの詳細情報を表示します</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedKnowledge?.category}</span>
                </div>
                <p className="text-sm">{selectedKnowledge?.description}</p>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">タグ</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedKnowledge?.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Button className="w-full">詳細表示</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// MeetingsTab Component
const MeetingsTab: React.FC = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<LocalMeeting | null>(null)
  const [activeTimer, setActiveTimer] = useState<LocalMeeting | null>(null)
  const [meetingMinutes, setMeetingMinutes] = useState({
    participants: "",
    discussion: "",
    decisions: "",
    nextActions: "",
  })

  const meetingsLocal: LocalMeeting[] = [
    {
      id: 1,
      title: "朝会",
      scheduledTime: "2025-02-08T09:00:00",
      participants: 5,
      agenda: [
        { topic: "進捗報告", duration: 15 },
        { topic: "問題点の共有", duration: 10 },
        { topic: "今日のタスク確認", duration: 5 },
      ],
    },
    {
      id: 2,
      title: "プロジェクトMTG",
      scheduledTime: "2025-02-08T14:00:00",
      participants: 8,
      agenda: [
        { topic: "プロジェクト概要", duration: 10 },
        { topic: "タイムライン確認", duration: 20 },
        { topic: "リスク分析", duration: 15 },
        { topic: "次のステップ", duration: 15 },
      ],
    },
  ]

  const MeetingTimerModal: React.FC<{ meeting: LocalMeeting; onClose: () => void }> = ({ meeting }) => {
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0)
    const [remainingTime, setRemainingTime] = useState(meeting.agenda[0].duration * 60)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
      let interval: NodeJS.Timeout
      if (isRunning && remainingTime > 0) {
        interval = setInterval(() => {
          setRemainingTime((prev) => prev - 1)
        }, 1000)
      } else if (remainingTime === 0 && currentAgendaIndex < meeting.agenda.length - 1) {
        setCurrentAgendaIndex((prev) => prev + 1)
        setRemainingTime(meeting.agenda[currentAgendaIndex + 1].duration * 60)
      }
      return () => clearInterval(interval)
    }, [isRunning, remainingTime, currentAgendaIndex, meeting.agenda])

    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
    }

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meeting.title} - タイマー</DialogTitle>
          <DialogDescription>アジェンダに沿って会議を進行するためのタイマーです。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{meeting.agenda[currentAgendaIndex].topic}</h3>
            <p className="text-4xl font-bold">{formatTime(remainingTime)}</p>
          </div>
          <div className="flex justify-center space-x-2">
            <Button onClick={() => setIsRunning(!isRunning)}>{isRunning ? "一時停止" : "スタート"}</Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentAgendaIndex(0)
                setRemainingTime(meeting.agenda[0].duration * 60)
                setIsRunning(false)
              }}
            >
              リセット
            </Button>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">アジェンダ</h4>
            {meeting.agenda.map((item: { topic: string; duration: number }, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.topic}</span>
                <span>{item.duration}分</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    )
  }

  const MeetingMinutesModal: React.FC<{ meeting: LocalMeeting; onClose: () => void }> = ({ meeting, onClose }) => {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meeting.title} - 議事録</DialogTitle>
          <DialogDescription>会議の議事録を作成してください。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-foreground">
              参加者
            </label>
            <Input
              id="participants"
              value={meetingMinutes.participants}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, participants: e.target.value })}
              placeholder="参加者名（カンマ区切り）"
            />
          </div>
          <div>
            <label htmlFor="discussion" className="block text-sm font-medium text-foreground">
              議論内容
            </label>
            <Textarea
              id="discussion"
              value={meetingMinutes.discussion}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, discussion: e.target.value })}
              placeholder="主な議論内容を記入"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="decisions" className="block text-sm font-medium text-foreground">
              決定事項
            </label>
            <Textarea
              id="decisions"
              value={meetingMinutes.decisions}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, decisions: e.target.value })}
              placeholder="決定事項を記入"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="nextActions" className="block text-sm font-medium text-foreground">
              次のアクション
            </label>
            <Textarea
              id="nextActions"
              value={meetingMinutes.nextActions}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, nextActions: e.target.value })}
              placeholder="次のアクションを記入"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose}>キャンセル</Button>
            <Button
              onClick={() => {
                // Here you would typically save the meeting minutes
        
                onClose()
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>会議管理</span>
          <Button asChild>
            <Link to="/meeting">
              <FilePlus className="mr-2 h-4 w-4" />
              新規作成
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetingsLocal.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow bg-muted/40">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{meeting.title}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedMeeting(meeting)}>
                      <Timer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setActiveTimer(meeting)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(meeting.scheduledTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{meeting.participants}名</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedMeeting && (
          <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
            <MeetingTimerModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
          </Dialog>
        )}

        {activeTimer && (
          <Dialog open={!!activeTimer} onOpenChange={() => setActiveTimer(null)}>
            <MeetingMinutesModal meeting={activeTimer} onClose={() => setActiveTimer(null)} />
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

// Main DashboardView Component
const DashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard")

  return (
            <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="manuals">業務マニュアル</TabsTrigger>
            <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
            <TabsTrigger value="meetings">会議管理</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-4">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="manuals" className="pt-4">
            <ManualsTab />
          </TabsContent>
          <TabsContent value="knowledge" className="pt-4">
            <KnowledgeTab />
          </TabsContent>
          <TabsContent value="meetings" className="pt-4">
            <MeetingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Types
interface ManualTemplate {
  id: number
  title: string
  description: string
  sections: string[]
  createdAt: string
  tags: string[]
}

interface KnowledgeCategory {
  id: number
  name: string
}

interface KnowledgeItem {
  id: number
  title: string
  category: string
  description: string
  tags: string[]
  createdAt: string
}

export default DashboardView
