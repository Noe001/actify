import { api } from './api';
import { ApiResponse, Task, PaginatedResponse, SubTask } from '../types/api';

// タスク作成/更新用のデータ型
interface TaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string | null;
  tags?: string;
  organization_id?: string;
  parent_task_id?: string;
  // サブタスクは更新・作成時に別途処理が必要なため、ここでは含めない
  // subtasks?: Array<{
  //   id?: string | number; 
  //   title: string; 
  //   status?: 'pending' | 'completed';
  // }>;
}

// タスクキャッシュ
const taskCache: Record<string, {data: Task, timestamp: number}> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5分間キャッシュを保持

/**
 * タスク管理サービス
 */
const taskService = {
  /**
   * タスク一覧を取得（チーム対応）
   * @param organizationId チームID
   * @param page ページ番号
   * @param perPage 1ページあたりの件数
   * @param filters フィルタ条件
   */
  async getTasks(organizationId: string, page = 1, perPage = 10, filters?: Record<string, any>): Promise<ApiResponse<PaginatedResponse<Task>>> {
    try {
    const response = await api.get<any>('/api/tasks', { 
      page, 
      per_page: perPage,
      organization_id: organizationId,
      ...filters
    });

      if (response.success && response.data) {
        // データとメタ情報があるケース
        if (response.data.data && response.data.meta) {
      return {
        success: true,
        data: {
          data: response.data.data,
          meta: {
            current_page: response.data.meta.current_page,
            last_page: response.data.meta.total_pages,
            per_page: response.data.meta.per_page,
            total_count: response.data.meta.total_count,
            total_pages: response.data.meta.total_pages
          }
        },
            message: response.message || 'タスクを取得しました'
      };
        }
        
        // データが配列で直接返ってくるケース
      if (Array.isArray(response.data)) {
        return { 
          success: true, 
            data: { 
              data: response.data as Task[], 
              meta: { 
                current_page: 1, 
                last_page: 1, 
                per_page: response.data.length, 
                total_count: response.data.length,
                total_pages: 1
              } 
            }, 
            message: response.message || 'タスクを取得しました' 
        };
        }
      }
      
      return { 
        success: false, 
        message: response.message || 'タスクデータの形式が不正です' 
      };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'タスク取得中にエラーが発生しました' 
      };
    }
  },

  /**
   * 特定のタスクを取得（キャッシュ対応）
   * @param id タスクID
   * @param forceRefresh キャッシュを無視して強制的に再取得するか
   */
  async getTask(id: string, forceRefresh = false): Promise<ApiResponse<Task>> {
    try {
      // キャッシュチェック
      const cachedTask = taskCache[id];
      const now = Date.now();
      
      // キャッシュが有効で、強制再取得でない場合はキャッシュから返す
      if (!forceRefresh && cachedTask && (now - cachedTask.timestamp) < CACHE_TTL) {
        return {
          success: true,
          data: cachedTask.data,
          message: 'キャッシュからタスクを取得しました'
        };
      }
      
      const response = await api.get<any>(`/api/tasks/${id}`);
      
      if (response.success && response.data) {
        let taskData: Task;
        
        // レスポンス構造に応じてデータを取得
      if (response.data.data) {
          taskData = response.data.data as Task;
      } else {
          taskData = response.data as Task;
      }
      
        // キャッシュを更新
        taskCache[id] = {
          data: taskData,
          timestamp: now
        };
        
        return {
          success: true,
          data: taskData,
          message: response.message || 'タスクを取得しました'
        };
      }
      
      return { 
        success: false, 
        message: response.message || 'タスクの取得に失敗しました' 
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'タスク取得中にエラーが発生しました' 
      };
      }
  },

  /**
   * キャッシュを無効化（更新や削除後に呼び出す）
   * @param id タスクID
   */
  invalidateCache(id?: string) {
    if (id) {
      // 特定のタスクのキャッシュを削除
      delete taskCache[id];
    } else {
      // すべてのタスクキャッシュをクリア
      Object.keys(taskCache).forEach(key => delete taskCache[key]);
    }
  },

  /**
   * 新しいタスクを作成（チーム対応）
   * @param organizationId チームID
   * @param taskData タスクデータ
   */
  async createTask(organizationId: string, taskData: TaskData): Promise<ApiResponse<Task>> {
    try {
      // サブタスク関連の処理を削除
      const taskDataWithOrg = { ...taskData, organization_id: organizationId };
      const response = await api.post('/api/tasks', { task: taskDataWithOrg });
      
      if (response.success && response.data) {
        return {
          success: true,
          message: 'タスクが作成されました',
          data: response.data as Task
        };
      }

      return {
        success: false,
        message: response.message || 'タスクの作成に失敗しました'
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'タスク作成中にエラーが発生しました'
      };
    }
  },

  /**
   * タスクを更新
   * @param id タスクID
   * @param taskData 更新データ
   */
  async updateTask(id: string, taskData: TaskData): Promise<ApiResponse<Task>> {
    try {
      // サブタスク関連の処理を削除
      const response = await api.patch(`/api/tasks/${id}`, { task: taskData });
      
      if (response.success && response.data) {
        // キャッシュを無効化
        this.invalidateCache(id);
        
        return {
          success: true,
          message: 'タスクが更新されました',
          data: response.data as Task
        };
      }

      return {
        success: false,
        message: response.message || 'タスクの更新に失敗しました'
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'タスク更新中にエラーが発生しました'
      };
    }
  },

  /**
   * タスクを削除
   * @param id タスクID
   */
  async deleteTask(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<null>(`/api/tasks/${id}`);
      
      // キャッシュを無効化
      this.invalidateCache(id);
      
      return response as ApiResponse<null>;
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'タスク削除中にエラーが発生しました'
      };
    }
  },
  
  /**
   * 自分のタスク一覧を取得
   */
  async getMyTasks(): Promise<ApiResponse<Task[]>> {
    try {
    const response = await api.get<any>('/api/tasks/my');
    
      if (response.success && response.data) {
        if (response.data.data) {
      return {
        success: true,
        data: response.data.data as Task[],
            message: response.message || 'マイタスクを取得しました'
      };
        }
        
       if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data as Task[],
            message: response.message || 'マイタスクを取得しました'
          };
        }
      }
      
      return {
        success: false,
        message: response.message || 'マイタスクの取得に失敗しました'
      };
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'マイタスク取得中にエラーが発生しました'
      };
    }
  },
  
  /**
   * タスクのステータスを更新
   * @param id タスクID
   * @param status 新しいステータス
   */
  async updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> {
    try {
    const response = await api.put<any>(`/api/tasks/${id}/status`, { status });
    
      // キャッシュを無効化
      this.invalidateCache(id);
      
      if (response.success && response.data) {
        const taskData = response.data.data || response.data;
        return {
          success: true,
          data: taskData as Task,
          message: response.message || 'ステータスが更新されました'
        };
      }
      
      return {
        success: false,
        message: response.message || 'ステータスの更新に失敗しました'
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ステータス更新中にエラーが発生しました'
      };
    }
  },
  
  /**
   * タスクの担当者を変更
   * @param id タスクID
   * @param userId 新しい担当者のID
   */
  async assignTask(id: string, userId: string): Promise<ApiResponse<Task>> {
    try {
    const response = await api.put<any>(`/api/tasks/${id}/assign`, { user_id: userId });
    
      // キャッシュを無効化
      this.invalidateCache(id);
      
      if (response.success && response.data) {
        const taskData = response.data.data || response.data;
        return {
          success: true,
          data: taskData as Task,
          message: response.message || '担当者が変更されました'
        };
      }
      
      return {
        success: false,
        message: response.message || '担当者の変更に失敗しました'
      };
    } catch (error) {
      console.error('Error assigning task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '担当者変更中にエラーが発生しました'
      };
    }
  },
  
  /**
   * ダッシュボード用のタスク統計情報を取得
   */
  async getTasksDashboard(): Promise<ApiResponse<any>> {
    try {
    const response = await api.get<any>('/api/tasks/dashboard');
    
      if (response.success && response.data) {
        const dashboardData = response.data.data || response.data;
        return {
          success: true,
          data: dashboardData,
          message: response.message || 'ダッシュボードデータを取得しました'
        };
      }
      
      return {
        success: false,
        message: response.message || 'ダッシュボードデータの取得に失敗しました'
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ダッシュボードデータ取得中にエラーが発生しました'
      };
    }
  },
  
  /**
   * カレンダービュー用のタスクデータを取得
   */
  async getTasksCalendar(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
    const response = await api.get<any>('/api/tasks/calendar', {
      start_date: startDate,
      end_date: endDate
    });
    
      if (response.success && response.data) {
        const calendarData = response.data.data || response.data;
        return {
          success: true,
          data: calendarData,
          message: response.message || 'カレンダーデータを取得しました'
        };
      }
      
      return {
        success: false,
        message: response.message || 'カレンダーデータの取得に失敗しました'
      };
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'カレンダーデータ取得中にエラーが発生しました'
      };
    }
  },
  
  /**
   * 複数タスクを一括更新
   */
  async batchUpdateTasks(tasks: Array<{id: string} & Partial<TaskData>>): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<any>('/api/tasks/batch_update', { tasks });
      
      // 更新したタスクのキャッシュをすべて無効化
      tasks.forEach(task => this.invalidateCache(task.id));
      
      return response;
    } catch (error) {
      console.error('Error batch updating tasks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'タスク一括更新中にエラーが発生しました'
      };
    }
  },
  
  /**
   * タスクの並び替え
   */
  async reorderTasks(taskIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await api.put<any>('/api/tasks/reorder', { task_ids: taskIds });
      
      // すべてのタスクキャッシュを無効化
      this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Error reordering tasks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'タスク並び替え中にエラーが発生しました'
      };
    }
  },
  
  /**
   * サブタスクの完了状態を切り替える
   * @param taskId 親タスクID
   * @param subtaskId サブタスクID
   */
  async toggleSubtaskStatus(taskId: string, subtaskId: string): Promise<ApiResponse<{subtask: Task, parent_task: Task}>> {
    try {
      // リクエストボディにサブタスクIDを含める -> ルートに含めるように変更
      const response = await api.put<any>(`/api/tasks/${taskId}/subtask/${subtaskId}/toggle`, {
        // ボディは空で良いか、必要に応じてパラメータを追加
        // debug_info: {
        //   task_id: taskId,
        //   subtask_id: subtaskId
        // }
      });
    
      // 親タスクと対象サブタスクのキャッシュを無効化
      this.invalidateCache(taskId);
      
      if (response.success && response.data) {
        const resultData = response.data.data || response.data;
        return {
          success: true,
          data: resultData as {subtask: Task, parent_task: Task},
          message: response.message || 'サブタスクのステータスを切り替えました'
        };
      }
      
      return {
        success: false,
        message: response.message || 'サブタスクのステータス切り替えに失敗しました'
      };
    } catch (error) {
      console.error('Error toggling subtask status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'サブタスクのステータス切り替え中にエラーが発生しました'
      };
    }
  },
};

export default taskService;

/**
 * タスクの進捗度を計算するヘルパー関数
 * @param task 進捗度を計算するタスク
 * @returns 0から100の間の進捗度
 */
export const getTaskProgress = (task: Task): number => {
  // タスクが完了している場合は100%
  if (task.status === 'completed') return 100;
  
  // サブタスクがある場合は、完了したサブタスクの割合を計算
  if (task.subtasks && task.subtasks.length > 0) {
    const completedSubtasks = task.subtasks.filter(subtask => 
      subtask.status === 'completed' || (subtask as any).completed === true
    ).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  }
  
  // 進行中のタスクで、サブタスクがない場合は50%とする
  if (task.status === 'in_progress') return 50;
  
  // それ以外の場合（未着手など）は0%
  return 0;
};
