"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/Header"
import OrganizationGuard from "@/components/OrganizationGuard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis
} from "recharts"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  LogIn,
  LogOut,
  Edit,
  Check,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import attendanceService from "@/services/attendanceService"
import { formatTime } from "@/utils/dateUtils"
import { Input } from "@/components/ui/input"
import { isSameMonth } from "date-fns"

// 勤怠履歴テーブルの型定義
interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  overtimeHours: number;
  status: string;
}

const AttendanceView: React.FC = () => {
  const [viewMode, setViewMode] = useState<"日次" | "週次" | "月次">("週次")
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<string>("")
  const [leaveStartDate, setLeaveStartDate] = useState<Date | undefined>(new Date())
  const [leaveEndDate, setLeaveEndDate] = useState<Date | undefined>(new Date())
  const [leaveReason, setLeaveReason] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>(formatTime(new Date()))
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [leaveHistory, setLeaveHistory] = useState<any[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null)
  
  // 勤怠グラフデータ用の状態
  const [graphData, setGraphData] = useState<any[]>([])
  const [graphLoading, setGraphLoading] = useState<boolean>(false)
  
  // 勤怠編集用の状態
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editStatus, setEditStatus] = useState("")
  
  // 現在時刻を1秒ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000); // 1秒ごとに更新
    return () => clearInterval(timer);
  }, []);
  
  // 今日の勤怠情報を取得
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        setLoading(true);
        const response = await attendanceService.getAttendance();
        
        if (response.success) {
          setTodayAttendance(response.data);
        } else {
          // APIからデータを取得できなかった場合はデフォルト値を設定
          setTodayAttendance({
            date: format(new Date(), 'yyyy-MM-dd'),
            check_in: null,
            check_out: null,
            status: 'pending'
          });
        }
      } catch (error) {
        console.error("勤怠データ取得エラー:", error);
        toast.error("勤怠データの取得に失敗しました");
        // エラー時にもデフォルト値を設定
        setTodayAttendance({
          date: format(new Date(), 'yyyy-MM-dd'),
          check_in: null,
          check_out: null,
          status: 'pending'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodayAttendance();
    
    // 定期的な更新（5分ごと）
    const attendanceRefreshTimer = setInterval(() => {
      fetchTodayAttendance();
    }, 300000); // 5分ごとに更新
    
    return () => clearInterval(attendanceRefreshTimer);
  }, []);
  
  // viewModeに応じたグラフデータの取得
  useEffect(() => {
    fetchGraphData();
  }, [viewMode]);
  
  // 勤怠履歴と勤怠サマリーを取得
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        await fetchAttendanceRecords();
        
        // 勤怠サマリーの取得
        const summaryResponse = await attendanceService.getAttendanceSummary();
        if (summaryResponse.success) {
          // サマリーデータを状態に保存
          setAttendanceSummary(summaryResponse.data);
        }
        
        // 休暇履歴の取得
        const leaveHistoryResponse = await attendanceService.getLeaveHistory();
        if (leaveHistoryResponse.success && Array.isArray(leaveHistoryResponse.data)) {
          // 休暇履歴データをダミーデータからAPIレスポンスに更新
          const formattedLeaveHistory = leaveHistoryResponse.data.map(leave => ({
            id: leave.id,
            type: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            reason: leave.reason,
            status: leave.status
          }));
          
          // 休暇履歴を状態に保存
          setLeaveHistory(formattedLeaveHistory);
        }
        
        // 初期表示時のグラフデータ取得
        await fetchGraphData();
      } catch (error) {
        console.error("勤怠データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, []);
  
  // グラフデータ取得
  const fetchGraphData = async () => {
    try {
      setGraphLoading(true);
      
      // viewModeに基づいてAPIのパラメータを決定
      const period = viewMode === "日次" ? "daily" : 
                     viewMode === "週次" ? "weekly" : "monthly";
      
      const response = await attendanceService.getAttendanceHistory(period);
      
      if (response.success && Array.isArray(response.data)) {
        // APIレスポンスをグラフ用に変換
        const formattedData = response.data.map(item => {
          // 日付の形式をチェックして安全に変換
          let label = "";
          
          try {
            // 様々な形式の日付に対応
            if (item.date && typeof item.date === 'string') {
              // 日付の前処理（APIの返す形式によって調整）
              let dateStr = item.date;
              
              // 日付文字列が有効かチェック
              const date = new Date(dateStr);
              
              if (!isNaN(date.getTime())) {
                // 有効な日付の場合、表示形式を調整
                if (viewMode === "月次") {
                  label = `${date.getMonth() + 1}月`;
                } else {
                  label = `${date.getMonth() + 1}/${date.getDate()}`;
                }
              } else {
                // 無効な日付の場合、日付文字列をそのまま使用
                label = dateStr || "日付なし";
              }
            } else if (item.month && typeof item.month === 'string') {
              // 月次データで month フィールドがある場合
              label = item.month;
            } else if (item.week && typeof item.week === 'string') {
              // 週次データで week フィールドがある場合
              label = item.week;
            } else if (item.day && typeof item.day === 'string') {
              // 日次データで day フィールドがある場合
              label = item.day;
            } else {
              // その他の場合はインデックスを使用
              label = `データ${item.id || ""}`;
            }
          } catch (err) {
            console.error("日付変換エラー:", err, item);
            label = "日付エラー";
          }
          
          return {
            date: label,
            勤務時間: item.total_hours || 0,
            残業時間: item.overtime_hours || 0
          };
        });
        
        // 処理済みのデータ
        let processedData = formattedData;
        
        // 日次表示の場合は7日分のデータを表示
        if (viewMode === "日次") {
          // データが多い場合は最新の7件だけを使用
          if (processedData.length > 7) {
            processedData = processedData.slice(-7);
          } 
          // データが7件未満の場合は空データで埋める
          else if (processedData.length < 7) {
            const emptyDataCount = 7 - processedData.length;
            const emptyData = Array(emptyDataCount).fill(0).map((_) => ({
              date: `-`,
              勤務時間: 0,
              残業時間: 0
            }));
            // 空データを後ろに追加して、最新データ（実データ）が左側に配置されるようにする
            processedData = [...processedData, ...emptyData];
          }
        }
        
        // データを逆順にして最新のデータが右側に表示されるようにする
        const reversedData = [...processedData].reverse();
        
        setGraphData(reversedData);
      } else {
        // APIから適切なデータが取得できなかった場合は空配列を設定
        console.error("グラフデータ取得エラー:", response);
        setGraphData([]);
      }
    } catch (error) {
      console.error("グラフデータ取得エラー:", error);
      setGraphData([]);
    } finally {
      setGraphLoading(false);
    }
  };
  
  // 勤怠記録を取得
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceHistory('daily');
      if (response.success) {
        // APIレスポンスが配列かチェック
        const records = Array.isArray(response.data) ? response.data : [];
        
        // レスポンスデータをAttendanceRecord形式に変換
        const formattedRecords = records.map(record => ({
          id: record.id,
          date: record.date,
          checkIn: record.check_in || '-',
          checkOut: record.check_out || '-',
          totalHours: record.total_hours || 0,
          overtimeHours: record.overtime_hours || 0,
          status: record.status || 'pending'
        }));
        
        setAttendanceRecords(formattedRecords);
      }
    } catch (error) {
      console.error("勤怠履歴取得エラー:", error);
      toast.error("勤怠履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 出勤打刻
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.checkIn();
      if (response.success && response.data) {
        // APIからのレスポンスデータでステートを更新
        setTodayAttendance(response.data);
        
        // 勤怠履歴を即時更新
        await fetchAttendanceRecords();
        
        toast.success("出勤を記録しました");
      } else {
        toast.error(response.message || "出勤打刻に失敗しました");
      }
    } catch (error) {
      console.error("出勤打刻エラー:", error);
      toast.error("出勤打刻に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 退勤打刻
  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.checkOut();
      if (response.success && response.data) {
        // APIからのレスポンスデータでステートを更新
        setTodayAttendance(response.data);
        
        // 勤怠履歴を即時更新
        await fetchAttendanceRecords();
        
        toast.success("退勤を記録しました");
      } else {
        // より詳細なエラーメッセージを表示
        const errorMessage = response.message || "退勤打刻に失敗しました";
        console.error("退勤打刻エラー:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("退勤打刻エラー:", error);
      // エラーレスポンスからメッセージを抽出
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.errors?.check_out?.join(', ') ||
        "退勤打刻に失敗しました。出勤時刻より後の時刻であることを確認してください。";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 休暇申請
  const handleLeaveRequest = async () => {
    if (!leaveType || !leaveStartDate || !leaveEndDate || !leaveReason) {
      toast.error("すべての項目を入力してください");
      return;
    }

    try {
      setLoading(true);
      // 実際のアプリケーションではAPI呼び出し
      const response = await attendanceService.requestLeave({
        leave_type: leaveType as 'paid' | 'sick' | 'other',
        start_date: format(leaveStartDate, 'yyyy-MM-dd'),
        end_date: format(leaveEndDate, 'yyyy-MM-dd'),
        reason: leaveReason
      });
      
      if (response.success) {
        // 休暇申請が成功したら、休暇履歴を即時更新
        const leaveHistoryResponse = await attendanceService.getLeaveHistory();
        if (leaveHistoryResponse.success && Array.isArray(leaveHistoryResponse.data)) {
          // 休暇履歴データを更新
          const formattedLeaveHistory = leaveHistoryResponse.data.map(leave => ({
            id: leave.id,
            type: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            reason: leave.reason,
            status: leave.status
          }));
          
          // 休暇履歴を状態に保存
          setLeaveHistory(formattedLeaveHistory);
        }
      }
      
      setIsLeaveDialogOpen(false);
      toast.success("休暇申請を送信しました");
      
      // フォームをリセット
      setLeaveType("");
      setLeaveStartDate(new Date());
      setLeaveEndDate(new Date());
      setLeaveReason("");
    } catch (error) {
      console.error("休暇申請エラー:", error);
      toast.error("休暇申請に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  
  // 勤怠記録の編集ダイアログを開く
  const openEditDialog = (record: AttendanceRecord) => {
    // 今月の勤怠のみ編集可能
    const recordDate = new Date(record.date);
    const currentDate = new Date();
    
    if (!isSameMonth(recordDate, currentDate)) {
      toast.error("今月の勤怠記録のみ編集できます");
      return;
    }
    
    setEditingRecord(record);
    setEditCheckIn(record.checkIn);
    setEditCheckOut(record.checkOut);
    setEditStatus(record.status);
    setIsEditDialogOpen(true);
  };
  
  // 本日の勤怠を編集
  const handleEditTodayAttendance = () => {
    if (!todayAttendance) return;
    
    // 本日の勤怠データを編集用に変換
    const todayRecord: AttendanceRecord = {
      id: 0, // 一時的なID
      date: todayAttendance.date,
      checkIn: todayAttendance.check_in || "",
      checkOut: todayAttendance.check_out || "",
      totalHours: 0, // 仮の値
      overtimeHours: 0, // 仮の値
      status: todayAttendance.status
    };
    
    setEditingRecord(todayRecord);
    setEditCheckIn(todayRecord.checkIn);
    setEditCheckOut(todayRecord.checkOut);
    setEditStatus(todayRecord.status);
    setIsEditDialogOpen(true);
  };
  
  // 勤怠記録の更新
  const handleUpdateAttendance = async () => {
    if (!editingRecord) return;
    
    try {
      setLoading(true);
      
      // 本日の勤怠編集の場合
      if (editingRecord.id === 0) {
        // 実際のAPIを呼び出す
        const response = await attendanceService.updateAttendanceByDate(
          editingRecord.date,
          {
            check_in: editCheckIn,
            check_out: editCheckOut,
            status: editStatus
          }
        );
        
        if (response.success) {
          // 本日の勤怠データを更新
          setTodayAttendance({
            ...todayAttendance,
            check_in: editCheckIn,
            check_out: editCheckOut,
            status: editStatus
          });
          
          // 勤怠履歴を即時更新
          await fetchAttendanceRecords();
          
          setIsEditDialogOpen(false);
          toast.success("本日の勤怠記録を更新しました");
        } else {
          toast.error("更新に失敗しました: " + response.message);
        }
        return;
      }
      
      // 過去の勤怠記録更新の場合
      const response = await attendanceService.updateAttendanceByDate(
        editingRecord.date,
        {
          check_in: editCheckIn,
          check_out: editCheckOut,
          status: editStatus
        }
      );
      
      if (response.success) {
        // 履歴データを更新
        await fetchAttendanceRecords();
        setIsEditDialogOpen(false);
        toast.success("勤怠記録を更新しました");
      } else {
        toast.error("更新に失敗しました: " + response.message);
      }
    } catch (error) {
      console.error("勤怠更新エラー:", error);
      toast.error("勤怠記録の更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present':
        return <Badge className="bg-teal-primary text-white">出勤</Badge>;
      case 'late':
        return <Badge className="bg-amber-500">遅刻</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">欠勤</Badge>;
      case 'holiday':
        return <Badge className="bg-teal-secondary text-white">休日</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  const getLeaveStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-teal-primary text-white">承認済</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">却下</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">審査中</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch(type) {
      case 'paid':
        return <Badge className="bg-teal-secondary text-white">有給休暇</Badge>;
      case 'sick':
        return <Badge className="bg-teal-light text-teal-deep">病気休暇</Badge>;
      case 'other':
        return <Badge className="bg-muted">その他</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  // 勤怠記録が編集可能かどうか判定
  const isEditableRecord = (date: string): boolean => {
    const recordDate = new Date(date);
    const currentDate = new Date();
    return isSameMonth(recordDate, currentDate);
  };

  // 時刻を HH:MM 形式にフォーマットする（秒を表示しない）
  const formatTimeWithoutSeconds = (timeString: string | null | undefined): string => {
    if (!timeString || timeString === "" || timeString === "-") return '-';
    // HH:MM:SS 形式から HH:MM 形式に変換（今後は必要なくなるが互換性のために残す）
    const match = timeString.match(/^(\d{1,2}):(\d{1,2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return timeString;
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <OrganizationGuard feature="勤怠管理">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">勤怠管理</h1>
        </div>
      <div className="flex-1 container mx-auto py-6 space-y-6">
        {/* 現在時刻と打刻ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">勤怠打刻</CardTitle>
              <CardDescription>本日の勤怠状況と打刻</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">本日の日付</div>
                  <div className="text-2xl font-semibold">{format(new Date(), 'yyyy年MM月dd日')}</div>
                  <div className="flex items-center justify-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xl">{currentTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className={`p-2 rounded ${todayAttendance?.check_in ? 'bg-teal-50' : 'bg-support-softGray'}`}>
                      <div className="text-sm text-muted-foreground">出勤時刻</div>
                      <div className={`font-medium ${todayAttendance?.check_in ? 'text-teal-primary' : ''}`}>
                        {todayAttendance?.check_in && todayAttendance.check_in !== ""
                          ? formatTimeWithoutSeconds(todayAttendance.check_in) 
                          : "未打刻"}
                      </div>
                    </div>
                    <div className={`p-2 rounded ${todayAttendance?.check_out ? 'bg-teal-100' : 'bg-support-softGray'}`}>
                      <div className="text-sm text-muted-foreground">退勤時刻</div>
                      <div className={`font-medium ${todayAttendance?.check_out ? 'text-teal-secondary' : ''}`}>
                        {todayAttendance?.check_out && todayAttendance.check_out !== ""
                          ? formatTimeWithoutSeconds(todayAttendance.check_out) 
                          : "未打刻"}
                      </div>
                    </div>
                  </div>
                  {todayAttendance?.status && (
                    <div className="mt-2">
                      {getStatusBadge(todayAttendance.status)}
                    </div>
                  )}
                </div>

                {/* 打刻関連のボタン */}
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  {!todayAttendance || !todayAttendance.check_in ? (
                    <Button 
                      onClick={handleCheckIn} 
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      出勤打刻
                    </Button>
                  ) : !todayAttendance.check_out ? (
                    <Button 
                      onClick={handleCheckOut} 
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      退勤打刻
                    </Button>
                  ) : (
                    <div className="text-sm">本日の勤務は終了しました</div>
                  )}
                  
                  {todayAttendance && (
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={handleEditTodayAttendance}
                    >
                      <Edit className="h-4 w-4" />
                      勤怠編集
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">休暇申請</CardTitle>
              <CardDescription>休暇の申請</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="text-sm text-muted-foreground">有給休暇残日数</div>
                    <div className="font-semibold">15日</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">病気休暇残日数</div>
                    <div className="font-semibold">5日</div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setIsLeaveDialogOpen(true)}>
                  休暇を申請する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 勤怠データのグラフ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">勤怠分析</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>勤務時間の推移</CardDescription>
              <div className="ml-auto">
                <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="日次">日次</TabsTrigger>
                    <TabsTrigger value="週次">週次</TabsTrigger>
                    <TabsTrigger value="月次">月次</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={graphData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="勤務時間" stackId="a" fill="#3B82F6" />
                <Bar dataKey="残業時間" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
            {graphLoading && (
              <div className="flex justify-center mt-4">
                <div className="text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">データを読み込み中...</p>
                </div>
              </div>
            )}
            {!graphLoading && graphData.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                表示するデータがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 勤怠履歴テーブル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">勤怠履歴</CardTitle>
            <CardDescription>過去の勤怠記録（今月の記録は編集可能）</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>出勤時刻</TableHead>
                  <TableHead>退勤時刻</TableHead>
                  <TableHead>勤務時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>編集</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{formatTimeWithoutSeconds(record.checkIn)}</TableCell>
                    <TableCell>{formatTimeWithoutSeconds(record.checkOut)}</TableCell>
                    <TableCell>{record.totalHours}時間</TableCell>
                    <TableCell>{record.overtimeHours}時間</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(record)}
                        disabled={!isEditableRecord(record.date)}
                        className={!isEditableRecord(record.date) ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 休暇リクエスト履歴 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">休暇申請履歴</CardTitle>
            <CardDescription>過去の休暇申請</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種類</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">休暇申請履歴がありません</TableCell>
                  </TableRow>
                ) : (
                  leaveHistory.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{getLeaveTypeBadge(request.type)}</TableCell>
                      <TableCell>
                        {new Date(request.startDate).toLocaleDateString()} 
                        {request.startDate !== request.endDate && ` 〜 ${new Date(request.endDate).toLocaleDateString()}`}
                      </TableCell>
                      <TableCell>{request.reason}</TableCell>
                      <TableCell>{getLeaveStatusBadge(request.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 今月の勤怠サマリー */}
        <Card>
          <CardHeader>
            <CardTitle>今月の勤怠サマリー</CardTitle>
            <CardDescription>当月の勤怠概要</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">出勤日数</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.present_days : "-"}/{attendanceSummary ? attendanceSummary.total_days : "-"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">遅刻日数</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.late_days : "-"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">総労働時間</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.total_hours : "-"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">残業時間</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.total_overtime : "-"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">有給休暇残</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.leave_balance?.paid : "-"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">病休残</span>
                <span className="text-2xl font-semibold mt-1">
                  {attendanceSummary ? attendanceSummary.leave_balance?.sick : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 休暇申請ダイアログ */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>休暇申請</DialogTitle>
            <DialogDescription>
              休暇の種類、期間、理由を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveType" className="text-right">
                種類
              </Label>
              <Select
                value={leaveType}
                onValueChange={setLeaveType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="休暇の種類を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">有給休暇</SelectItem>
                  <SelectItem value="sick">病気休暇</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveStartDate" className="text-right">
                開始日
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveStartDate ? (
                        format(leaveStartDate, "yyyy年MM月dd日")
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={leaveStartDate}
                      onSelect={setLeaveStartDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveEndDate" className="text-right">
                終了日
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveEndDate ? (
                        format(leaveEndDate, "yyyy年MM月dd日")
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={leaveEndDate}
                      onSelect={setLeaveEndDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveReason" className="text-right">
                理由
              </Label>
              <Textarea
                id="leaveReason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="休暇の理由を入力してください"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleLeaveRequest}
              disabled={loading}
            >
              申請する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 勤怠編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>勤怠記録の編集</DialogTitle>
            <DialogDescription>
              {editingRecord?.date}の勤怠記録を編集します
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCheckIn" className="text-right">
                出勤時刻
              </Label>
              <Input
                id="editCheckIn"
                type="time"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCheckOut" className="text-right">
                退勤時刻
              </Label>
              <Input
                id="editCheckOut"
                type="time"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStatus" className="text-right">
                状態
              </Label>
              <Select
                value={editStatus}
                onValueChange={setEditStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="状態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">出勤</SelectItem>
                  <SelectItem value="late">遅刻</SelectItem>
                  <SelectItem value="absent">欠勤</SelectItem>
                  <SelectItem value="holiday">休日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateAttendance}
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-2" />
              更新する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </OrganizationGuard>
    </div>
  )
}

export default AttendanceView 
