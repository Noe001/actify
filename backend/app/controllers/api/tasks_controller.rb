module Api
  class TasksController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :authenticate_user, only: [:index, :show, :my, :calendar, :dashboard]
    before_action :set_task, only: [:show, :update, :destroy, :update_status, :assign, :toggle_subtask]
    
    # Task コントローラでパラメータを許可する明示的な設定を追加
    wrap_parameters include: [:title, :description, :status, :priority, :due_date, 
                           :assigned_to, :tags, :organization_id, :parent_task_id, 
                           :subtasks]

    # タスク一覧の取得
    def index
      begin
        if params[:dashboard].present?
          # ダッシュボード用のタスク一覧を返す
          tasks = Task.where(assigned_to: current_user.id)
                  .includes(:user, :organization, :subtasks)
                  .where(parent_task_id: nil)
                  .where('due_date IS NOT NULL AND due_date <= ?', 7.days.from_now)
                  .order(due_date: :asc)
                  .limit(5)
          
          @tasks = {
            upcoming: tasks,
            overdue: Task.where(assigned_to: current_user.id)
                      .includes(:user, :organization, :subtasks)
                      .where('due_date < ?', Date.today)
                      .where.not(status: 'completed')
                      .order(due_date: :asc)
                      .limit(5),
            recent: Task.where(assigned_to: current_user.id)
                    .includes(:user, :organization, :subtasks)
                    .order(created_at: :desc)
                    .limit(5)
          }
          
          render json: { 
            success: true, 
            data: @tasks.transform_values { |tasks| ActiveModel::Serializer::CollectionSerializer.new(tasks, serializer: TaskSerializer, include: [:user, :subtasks]) }
          }
        
          # カレンダー用のタスク一覧を返す
          start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
          end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.today.end_of_month
          
          tasks = Task.where(assigned_to: current_user.id)
                    .includes(:user, :organization, :subtasks)
                    .where('due_date >= ? AND due_date <= ?', start_date, end_date)
          
          render json: { success: true, data: ActiveModel::Serializer::CollectionSerializer.new(tasks, serializer: TaskSerializer, include: [:user, :subtasks]) }
        elsif params[:my].present?
          # 自分のタスク一覧を返す
          tasks = Task.where(assigned_to: current_user.id)
                    .includes(:user, :organization, :subtasks)
                    .order(created_at: :desc)

          # 通常のページネーションを適用
          page = (params[:page] || 1).to_i
          per_page = (params[:per_page] || 10).to_i
          offset = (page - 1) * per_page
          total_count = tasks.count
          total_pages = (total_count.to_f / per_page).ceil

          paginated_tasks = tasks.offset(offset).limit(per_page)
          
          render json: { 
            success: true, 
            data: ActiveModel::Serializer::CollectionSerializer.new(paginated_tasks, serializer: TaskSerializer, include: [:user, :subtasks]),
            meta: {
              current_page: page,
              total_pages: total_pages,
              total_count: total_count,
              per_page: per_page
            }
          }
        else
          # 通常のタスク一覧を返す
          tasks = if params[:search].present?
                   Task.where('title LIKE ? OR description LIKE ?', "%#{params[:search]}%", "%#{params[:search]}%")
                      .includes(:user, :organization, :subtasks)
                 else
                   Task.where(parent_task_id: nil)
                      .includes(:user, :organization, :subtasks)
                 end
  
          # ソート順を設定
          order_by = params[:order_by] || 'created_at'
          order_direction = params[:order_direction] || 'desc'
          
          # ステータスでフィルタリング
          if params[:status].present?
            tasks = tasks.where(status: params[:status])
          end
          
          # 期限でフィルタリング
          if params[:due_date].present?
            due_date = Date.parse(params[:due_date])
            tasks = tasks.where(due_date: due_date.beginning_of_day..due_date.end_of_day)
          end
          
          # 担当者でフィルタリング
          if params[:assigned_to].present?
            tasks = tasks.where(assigned_to: params[:assigned_to])
          end

          # 通常のページネーションを適用
          page = (params[:page] || 1).to_i
          per_page = (params[:per_page] || 10).to_i
          offset = (page - 1) * per_page
          total_count = tasks.count
          total_pages = (total_count.to_f / per_page).ceil

          ordered_tasks = tasks.order("#{order_by} #{order_direction}")
          paginated_tasks = ordered_tasks.offset(offset).limit(per_page)
          
          render json: { 
            success: true, 
            data: ActiveModel::Serializer::CollectionSerializer.new(paginated_tasks, serializer: TaskSerializer, include: [:user, :subtasks]),
            meta: {
              current_page: page,
              total_pages: total_pages,
              total_count: total_count,
              per_page: per_page
            }
          }
        end
      rescue => e
        Rails.logger.error "TasksController#index error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { success: false, error: "タスクの取得に失敗しました: #{e.message}" }, status: :internal_server_error
      end
    end

    # 自分のタスク一覧
    def my
  
      tasks = current_user.tasks
              .includes(:user, :organization, :subtasks)
              .parent_tasks
              .order(created_at: :desc)  # 親タスクのみ取得
      
      # タスクをシリアライズ
      serialized_tasks = tasks.map { |task| TaskSerializer.new(task).as_json }
      
      render json: { success: true, data: serialized_tasks }  # TaskSerializerを使用
    rescue => e

      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # タスク詳細の取得
    def show
      # タスクをリロードして最新の情報を取得
      @task.reload
      
      puts "[Controller Debug] Rendering task with ID: #{@task.id}"
      
      # シリアライザーを直接指定し、サブタスクを明示的に含める
      render json: @task, serializer: TaskSerializer, success: true, message: "Task fetched successfully", include: [:user, :subtasks]
    end

    # タスクの作成
    def create
      # Build task first, then handle attachments separately if needed
      task = current_user.tasks.build(task_params.except(:attachments))

      # トランザクション開始
      ActiveRecord::Base.transaction do
        if task.save
          puts "[DEBUG] Task base saved successfully. ID: #{task.id}" # Log base save

          # Handle attachments after task is saved
          if task_params[:attachments].present?
            puts "[DEBUG] Attaching files: #{task_params[:attachments].map(&:original_filename).join(', ')}" # Log filenames
            # === Broad Exception Catching Start ===
            begin
              puts "[DEBUG] About to call task.attachments.attach with: #{task_params[:attachments].inspect}"
              task.attachments.attach(task_params[:attachments]) # The critical call
              puts "[DEBUG] task.attachments.attach finished (or did not raise an immediate error)."

              # Keep the immediate verification log from before, as it was useful
              task.reload
              puts "[DEBUG] Verification after attach - task.attachments.attached?: #{task.attachments.attached?}"
              if task.attachments.attached?
                attached_blob = task.attachments.blobs.last
                final_path = ActiveStorage::Blob.service.path_for(attached_blob.key) rescue "Path not found"
                puts "[DEBUG] Verification after attach - Attached Blob ID: #{attached_blob.id}, Key: #{attached_blob.key}"
                puts "[DEBUG] Verification after attach - Expected Final Path: #{final_path}"
                file_exists_immediately = File.exist?(final_path) rescue false
                puts "[DEBUG] Verification after attach - File.exist?(final_path) result: #{file_exists_immediately}"
                unless file_exists_immediately
                  puts "[ERROR] File NOT found at final path immediately after attach!"
                end
              else
                 puts "[ERROR] task.attachments.attached? is false immediately after attach call!"
              end

            rescue ActiveRecord::Rollback => ar_rollback
                # This is expected if validation fails later or explicitly raised
                puts "[DEBUG] Transaction rolled back: #{ar_rollback.message}"
                raise ar_rollback # Re-raise to let the outer transaction handler catch it
            rescue StandardError => e # Catch any other standard error during attach
                puts "[CRITICAL ERROR] Exception caught DIRECTLY during task.attachments.attach:"
                puts "[CRITICAL ERROR]   Error Class: #{e.class.name}"
                puts "[CRITICAL ERROR]   Error Message: #{e.message}"
                puts "[CRITICAL ERROR]   Backtrace:\n#{e.backtrace.join("\n")}"
                task.errors.add(:attachments, "の保存中に予期せぬエラーが発生しました: #{e.message}")
                # Decide whether to rollback or continue, likely rollback is safest
                raise ActiveRecord::Rollback # Force rollback on unexpected errors
            # === Broad Exception Catching End ===
            end
          end

          # サブタスクの処理 (Attachmentエラーがなければ実行)
          if params[:task][:subtasks].present? && task.errors.empty?
            params[:task][:subtasks].each do |subtask_params|
              subtask = current_user.tasks.build(
                title: subtask_params[:title],
                status: 'pending',
                parent_task_id: task.id,
                organization_id: task.organization_id
              )
              subtask.save!
            end
          end
          
          # Check for errors added during attachment processing before rendering success
          if task.errors.empty?
            # TaskSerializerを使用してタスクデータをシリアライズ
            serialized_task = TaskSerializer.new(task.reload).as_json
            
            render json: { 
              success: true, 
              data: serialized_task, 
              message: 'タスクが作成されました' 
            }, status: :created
          else
            # Render errors if attachment failed
            puts "[DEBUG] Task creation failed due to attachment error."
            render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
          end

        else
          # --- デバッグコード追加 開始 ---
          puts "[DEBUG] Task initial save failed. Errors: #{task.errors.full_messages.inspect}"
          # --- デバッグコード追加 終了 ---
          render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue ActiveRecord::Rollback
        # Transaction was rolled back (likely due to attachment error), errors are already in task.errors
        puts "[DEBUG] Transaction rolled back."
        render json: { success: false, errors: task.errors.full_messages }, status: :unprocessable_entity
    rescue => e
      # --- デバッグコード追加 開始 ---
      puts "[DEBUG] Exception in create: #{e.message}"
      puts e.backtrace.join("\n")
      # --- デバッグコード追加 終了 ---
      render json: { success: false, message: "予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error # General error
    end

    # タスクの更新
    def update
      # タスクが見つからない場合のエラーハンドリング
      unless @task
        render json: { success: false, message: 'タスクが見つかりません' }, status: :not_found
        return
      end

      # Process attachments if they exist
      file_data = []
      if request.content_type =~ /multipart\/form-data/
        params.each do |key, value|
          if value.is_a?(ActionDispatch::Http::UploadedFile) || value.is_a?(Rack::Test::UploadedFile)
            file_data << value
          end
        end
      end
      
      if file_data.any?
        puts "[DEBUG] Found #{file_data.size} files directly in params"
      end

      current_task_params = task_params # Call task_params once
      # retained_ids の取得は task_params の結果を使用 (クリーニング後の値)
      retained_ids = current_task_params[:retained_attachment_ids] || []
      
      # パラメータから直接添付ファイルを取得
      new_attachments = []
      
      # 1. 標準的なパスでファイルを探す
      if params[:task] && params[:task][:attachments].present?
        if params[:task][:attachments].is_a?(Array)
          params[:task][:attachments].each_with_index do |attachment, idx|
            if attachment.respond_to?(:original_filename)
              new_attachments << attachment
            end
          end
        elsif params[:task][:attachments].respond_to?(:original_filename)
          new_attachments << params[:task][:attachments]
        end
      end
      
      # 2. フォームデータからファイルを直接探す方法
      params.each do |key, value|
        next unless key.to_s.include?('attachment')
        
        if value.is_a?(ActionDispatch::Http::UploadedFile) || value.respond_to?(:original_filename)
          new_attachments << value
        elsif value.is_a?(Array)
          value.each_with_index do |item, idx|
            if item.is_a?(ActionDispatch::Http::UploadedFile) || item.respond_to?(:original_filename)
              new_attachments << item
            end
          end
        end
      end
      
      # 3. ファイルパラメータをさらに探索
      file_params = params.to_unsafe_h.select { |k, v| v.is_a?(ActionDispatch::Http::UploadedFile) }
      file_params.each do |key, value|
        new_attachments << value
      end
      
      puts "[DEBUG] Filtered attachments: #{new_attachments.inspect}"
      
      # --- 既存のデバッグコード ---
      puts "[DEBUG] Retained Attachment IDs (after permit & clean): #{retained_ids.inspect}"
      puts "[DEBUG] New Attachments received (after permit & clean): #{new_attachments.inspect}"
      # --- 既存のデバッグコード ---

      # トランザクション開始
      ActiveRecord::Base.transaction do
        # --- デバッグコード追加 開始 ---
        existing_attachment_ids = @task.attachments.map { |att| att.id.to_s }
        puts "[DEBUG] Existing Attachment IDs before update: #{existing_attachment_ids.inspect}"
        # --- デバッグコード追加 終了 ---

        # 1. タスクの基本情報を更新 (添付ファイル関連を除く)
        if @task.update(current_task_params.except(:attachments, :retained_attachment_ids, :subtasks))
          puts "[DEBUG] Task base attributes updated successfully."

          # 2. 既存の添付ファイルを整理 (削除)
          begin
            attachments_to_purge = @task.attachments.reject { |att| retained_ids.include?(att.id.to_s) }
            if attachments_to_purge.any?
              puts "[DEBUG] Purging attachments with IDs: #{attachments_to_purge.map(&:id).inspect}"
              attachments_to_purge.each(&:purge) # 個別にpurgeする
            else
              puts "[DEBUG] No attachments need to be purged."
            end
          rescue => purge_error
            puts "[DEBUG] Error purging attachments: #{purge_error.message}"
            puts purge_error.backtrace.join("\n")
            @task.errors.add(:base, "既存の添付ファイルの削除に失敗しました: #{purge_error.message}")
            raise ActiveRecord::Rollback
          end

          # 3. 新しい添付ファイルを追加
          if new_attachments.present? && new_attachments.any?
             puts "[DEBUG] Attempting to attach #{new_attachments.size} files"
             begin
               # ActionDispatch::Http::UploadedFile オブジェクトのみを選択
               valid_attachments = []
               
               # 各添付ファイルの詳細情報をログに出力
               new_attachments.each_with_index do |attachment, idx|
                 puts "[DEBUG] Attachment #{idx} type: #{attachment.class.name}"
                 
                 if attachment.respond_to?(:original_filename)
                   puts "[DEBUG] Filename: #{attachment.original_filename}, Content-Type: #{attachment.content_type}, Size: #{attachment.size rescue 'unknown'}"
                   valid_attachments << attachment
                 end
               end
               
               if valid_attachments.any?
                 puts "[DEBUG] Attaching #{valid_attachments.size} valid files"
                 @task.attachments.attach(valid_attachments)
                 puts "[DEBUG] Attachment complete. Verifying..."
                 
                 # 添付した後の検証
                 @task.reload
                 attached_count = @task.attachments.count
                 puts "[DEBUG] Total attachments after operation: #{attached_count}"
               else
                 puts "[DEBUG] No valid attachments found to attach after strict filtering."
               end
             rescue => attach_error
                puts "[DEBUG] Error attaching new files during update: #{attach_error.message}"
                puts attach_error.backtrace.join("\n")
                @task.errors.add(:attachments, "新しいファイルの追加に失敗しました: #{attach_error.message}")
                raise ActiveRecord::Rollback
             end
          else
             puts "[DEBUG] No new files to attach."
          end

          # --- デバッグコード追加 開始 --- (最終確認)
          @task.reload # Attach後にもリロード
          final_attachment_ids = @task.attachments.map { |att| att.id.to_s }
          puts "[DEBUG] Final Attachment IDs after update: #{final_attachment_ids.inspect}"
          if @task.attachments.attached?
            @task.attachments.each do |attachment|
              puts "[DEBUG] Final attached file: #{attachment.filename}, ID: #{attachment.id}"
            end
          else
            puts "[DEBUG] No attachments found after update process."
          end
          # --- デバッグコード追加 終了 ---

          # サブタスクの更新処理 - Active Recordのネストされた属性機能を利用
          # task_paramsでsubtasks_attributesが許可されているので、@task.updateが自動的に処理する
          
          # 既存のサブタスク処理ロジックは不要なのでコメントアウトまたは削除
          # if params[:task][:subtasks].present? && @task.errors.empty?
          #   begin
          #     subtasks_data = if params[:task][:subtasks].is_a?(String)
          #       # ... (JSON parsing logic)
          #     else
          #       params[:task][:subtasks]
          #     end
          #     
          #     if subtasks_data.present? && subtasks_data.is_a?(Array)
          #       puts "[DEBUG] Processing #{subtasks_data.length} subtasks"
          #       existing_subtasks = @task.subtasks.index_by(&:id)
          #       subtasks_data.each do |subtask_data|
          #         # ... (Update/Create logic)
          #       end
          #       puts "[DEBUG] Subtasks processing completed"
          #     end
          #   rescue => e
          #     puts "[DEBUG] Error processing subtasks: #{e.message}"
          #   end
          # end

          # 4. 最終結果をレンダリング
          if @task.errors.empty?
            # タスクを再読み込みして最新の添付ファイル状態を取得
            @task.reload

            # 添付ファイルIDを確認
            attachment_ids = @task.attachments.map(&:id)
            puts "[DEBUG] Final Attachment IDs after update: #{attachment_ids.inspect}"
            
            # 最終的な添付ファイルの詳細をログに出力
            @task.attachments.each do |att|
              blob = att.blob
              puts "[DEBUG] Final attached file: #{blob.filename}, ID: #{att.id}"
            end

            # TaskSerializerを使用してタスクをシリアライズ
            serialized_task = TaskSerializer.new(@task).as_json
            puts "[DEBUG] Serialized task response: #{serialized_task.inspect}"
           
            render json: {
              success: true,
              data: serialized_task,
              message: 'タスクが更新されました'
            }, status: :ok
          else
             puts "[DEBUG] Task update failed due to errors."
             render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
          end

        else
           # --- デバッグコード追加 開始 ---
          puts "[DEBUG] Task base update failed. Errors: #{@task.errors.full_messages.inspect}"
          # --- デバッグコード追加 終了 ---
          render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue ActiveRecord::Rollback
        puts "[DEBUG] Transaction rolled back during update."
        # エラーは@task.errorsに含まれているはずなのでそのまま返す
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
    rescue => e
      # --- デバッグコード追加 開始 ---
      puts "[DEBUG] Unexpected exception in update: #{e.message}"
      puts e.backtrace.join("\n")
      # --- デバッグコード追加 終了 ---
      render json: { success: false, message: "予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error
    end

    # タスクの削除
    def destroy
      @task.destroy
      render json: { success: true, message: 'タスクが削除されました' }
    end

    # タスクのステータス更新
    def update_status
      if @task.update(status: params[:status])
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: 'ステータスが更新されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # タスクの担当者を変更
    def assign
      user = User.find_by(id: params[:user_id])
      
      if user.nil?
        return render json: { success: false, message: '指定されたユーザーが見つかりません' }, status: :not_found
      end
      
      @task.assigned_to = user.id
      
      if @task.save
        render json: { success: true, data: @task.reload.as_json(include: :subtasks), message: '担当者が変更されました' }
      else
        render json: { success: false, errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    # カレンダービュー用のタスクデータ
    def calendar
      start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
      end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current.end_of_month
      
      tasks = current_user.tasks.parent_tasks
        .where('due_date BETWEEN ? AND ?', start_date, end_date)
        .order(due_date: :asc)
      
      # カレンダー表示用にデータを整形
      calendar_data = tasks.group_by { |task| task.due_date.to_s }
      
      render json: { success: true, data: calendar_data }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # ダッシュボード用のタスク統計情報
    def dashboard
      # 最近のタスク
      recent_tasks = current_user.tasks.parent_tasks.recent.limit(5)
      
      # 優先度別タスク数
      priority_counts = {
        high: current_user.tasks.parent_tasks.high_priority.count,
        medium: current_user.tasks.parent_tasks.where(priority: 'medium').count,
        low: current_user.tasks.parent_tasks.where(priority: 'low').count
      }
      
      # ステータス別タスク数
      status_counts = {
        pending: current_user.tasks.parent_tasks.pending.count,
        in_progress: current_user.tasks.parent_tasks.in_progress.count,
        completed: current_user.tasks.parent_tasks.completed.count
      }
      
      # 期日間近のタスク
      upcoming_tasks = current_user.tasks.parent_tasks.due_soon.where.not(status: 'completed').limit(5)
      
      # 期限切れタスク
      overdue_tasks = current_user.tasks.parent_tasks.overdue.limit(5)
      
      render json: {
        success: true,
        data: {
          recent_tasks: recent_tasks.as_json(include: :subtasks),
          priority_counts: priority_counts,
          status_counts: status_counts,
          upcoming_tasks: upcoming_tasks.as_json(include: :subtasks),
          overdue_tasks: overdue_tasks.as_json(include: :subtasks)
        }
      }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # 複数タスクの一括更新
    def batch_update
      tasks_params = params[:tasks]
      results = { success: [], failed: [] }
      
      tasks_params.each do |task_param|
        task = Task.find_by(id: task_param[:id])
        
        if task.nil?
          results[:failed] << { id: task_param[:id], error: "タスクが見つかりません" }
          next
        end
        
        # タスクの更新
        if task.update(task_param.permit(:title, :description, :status, :priority, :due_date, :assigned_to, :tags))
          results[:success] << { id: task.id }
        else
          results[:failed] << { id: task.id, errors: task.errors.full_messages }
        end
      end
      
      render json: { success: true, data: results }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end
    
    # タスクの並び替え（ドラッグ＆ドロップでの順序変更）
    def reorder
      task_ids = params[:task_ids]
      
      if task_ids.blank?
        return render json: { success: false, message: 'タスクIDが指定されていません' }, status: :bad_request
      end
      
      # 並べ替え処理を実装
      # ここでは優先度順で自動的に並べる例を示す
      task_ids.each_with_index do |task_id, index|
        task = Task.find_by(id: task_id)
        if task.present?
          # インデックスに基づいて優先度を設定
          priority = case index
                    when 0..2 then 'high'
                    when 3..7 then 'medium'
                    else 'low'
                    end
          
          task.update(priority: priority)
        end
      end
      
      render json: { success: true, message: 'タスクの順序が更新されました' }
    rescue => e
      render json: { success: false, message: e.message }, status: :internal_server_error
    end

    # サブタスクの完了状態を切り替える
    def toggle_subtask
      # URLパスからではなく、リクエストボディからsubtask_idを取得
      subtask_id = params[:subtask_id]
      
      unless subtask_id
        return render json: { success: false, message: 'サブタスクIDが指定されていません' }, status: :bad_request
      end
      
      subtask = Task.find_by(id: subtask_id, parent_task_id: @task.id)
      
      if subtask.nil?
        return render json: { success: false, message: 'サブタスクが見つかりません' }, status: :not_found
      end
      
      # ステータスの切り替え
      new_status = subtask.status == 'completed' ? 'pending' : 'completed'
      
      if subtask.update(status: new_status)
        # 親タスクをリロードして最新のサブタスク情報を取得
        @task.reload
        
        render json: { 
          success: true, 
          data: {
            subtask: subtask.as_json, # サブタスク単体も返す
            parent_task: TaskSerializer.new(@task).as_json # 親タスクをシリアライザー経由で返す
          }, 
          message: 'サブタスクのステータスが更新されました' 
        }
      else
        render json: { success: false, errors: subtask.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_task
      @task = Task.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, message: 'タスクが見つかりません' }, status: :not_found
    end

    def task_params
      # Permit attachments and retained_attachment_ids
      permitted_params = params.require(:task).permit(
        :title, :description, :status, :priority, :due_date, :assigned_to, 
        :tags, :organization_id, :parent_task_id,
        retained_attachment_ids: [],
        attachments: [], # Permit attachments as an array
        # ネストされたサブタスク属性を許可
        subtasks_attributes: [:id, :title, :status, :_destroy] 
      )
      
      # tagsをカンマ区切りの文字列に変換
      if permitted_params[:tags].is_a?(Array)
        permitted_params[:tags] = permitted_params[:tags].join(',')
      end
      
      # assigned_to が空文字の場合にnilに変換
      if permitted_params[:assigned_to] == ""
        permitted_params[:assigned_to] = nil
      end

      # デバッグ: パラメータの内容を出力
      # puts "Permitted Task Params: #{permitted_params.inspect}"

      permitted_params
    end
  end
end
