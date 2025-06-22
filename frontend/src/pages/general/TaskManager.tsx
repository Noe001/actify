import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus, Search, Clock, User, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Header from "@/components/Header";
import OrganizationGuard from "@/components/OrganizationGuard";
import { useOrganization } from "@/contexts/OrganizationContext";
import taskService from "@/services/taskService";
import { Task } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// タスク作成用のデータ型
interface TaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string | null;
  tags?: string;
  organization_id?: string;
}

const TaskManagerView: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 新規タスク作成用の状態
  const [newTask, setNewTask] = useState<TaskData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    assigned_to: user?.id?.toString() || null
  });



  // タスク一覧を取得
  const fetchTasks = async () => {
    if (!currentOrganization) return;
    
    try {
      const response = await taskService.getTasks(currentOrganization.id.toString(), 1, 50, { organization_id: currentOrganization.id });
      if (response.success && response.data) {
        const taskList = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTasks(taskList);
        setFilteredTasks(taskList);
      }
    } catch (error) {
      console.error('タスクの取得に失敗しました:', error);
      toast.error('タスクの取得に失敗しました');
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchTasks();
    }
  }, [currentOrganization]);

  // フィルタリング処理
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // 新規タスク作成
  const handleCreateTask = async () => {
    if (!currentOrganization) return;

    try {
      const response = await taskService.createTask(currentOrganization.id.toString(), newTask);
      if (response.success) {
        toast.success('タスクを作成しました');
        setIsCreateDialogOpen(false);
        setNewTask({
          title: "",
          description: "",
          status: "pending",
          priority: "medium",
          due_date: "",
          assigned_to: user?.id?.toString() || null
        });
        fetchTasks();
      } else {
        toast.error(response.message || 'タスクの作成に失敗しました');
      }
    } catch (error) {
      console.error('タスクの作成に失敗しました:', error);
      toast.error('タスクの作成に失敗しました');
    }
  };

  // タスクステータス更新
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, newStatus as 'pending' | 'in_progress' | 'completed');
      if (response.success) {
        toast.success('タスクのステータスを更新しました');
        fetchTasks();
      } else {
        toast.error(response.message || 'ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('ステータスの更新に失敗しました:', error);
      toast.error('ステータスの更新に失敗しました');
    }
  };

  // 優先度のバッジ色を取得
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // ステータスのアイコンを取得
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "pending": return <Circle className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <OrganizationGuard feature="タスク管理">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">タスク管理</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規タスク
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>新規タスク作成</DialogTitle>
                  <DialogDescription>
                    新しいタスクの詳細を入力してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">タイトル</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="タスクのタイトルを入力"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="タスクの詳細説明"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                                         <div>
                       <Label htmlFor="priority">優先度</Label>
                       <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="high">高</SelectItem>
                           <SelectItem value="medium">中</SelectItem>
                           <SelectItem value="low">低</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label htmlFor="status">ステータス</Label>
                       <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value as 'pending' | 'in_progress' | 'review' | 'completed' })}>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="pending">未着手</SelectItem>
                           <SelectItem value="in_progress">進行中</SelectItem>
                           <SelectItem value="completed">完了</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                  <div>
                    <Label htmlFor="due_date">期限</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateTask} disabled={!newTask.title}>
                      作成
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* フィルタとサーチ */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="タスクを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
                                       <SelectContent>
                           <SelectItem value="all">すべて</SelectItem>
                           <SelectItem value="pending">未着手</SelectItem>
                           <SelectItem value="in_progress">進行中</SelectItem>
                           <SelectItem value="completed">完了</SelectItem>
                         </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タスク一覧 */}
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">タスクが見つかりませんでした。</p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="bg-muted/40 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(task.due_date), 'yyyy/MM/dd', { locale: ja })}
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              担当者: {task.assigned_to}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                                                 <Button
                           variant="outline"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                             handleStatusUpdate(task.id.toString(), newStatus);
                           }}
                         >
                           {task.status === 'completed' ? '未完了にする' : '完了にする'}
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* タスク詳細ダイアログ */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTask && getStatusIcon(selectedTask.status)}
                  {selectedTask?.title}
                </DialogTitle>
              </DialogHeader>
              {selectedTask && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(selectedTask.priority)}>
                      優先度: {selectedTask.priority === 'high' ? '高' : selectedTask.priority === 'medium' ? '中' : '低'}
                    </Badge>
                                         <Badge variant="outline">
                       {selectedTask.status === 'pending' ? '未着手' : 
                        selectedTask.status === 'in_progress' ? '進行中' : '完了'}
                     </Badge>
                  </div>
                  {selectedTask.description && (
                    <div>
                      <h4 className="font-semibold mb-2">説明</h4>
                      <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedTask.due_date && (
                      <div>
                        <h4 className="font-semibold">期限</h4>
                        <p>{format(new Date(selectedTask.due_date), 'yyyy年MM月dd日', { locale: ja })}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">作成日</h4>
                      <p>{format(new Date(selectedTask.created_at), 'yyyy年MM月dd日', { locale: ja })}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </OrganizationGuard>
    </div>
  );
};

export default TaskManagerView; 
