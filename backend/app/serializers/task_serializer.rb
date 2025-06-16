class TaskSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers
  
  attributes :id, :title, :description, :status, :priority, :due_date, :assigned_to, 
             :created_at, :updated_at, :tag_list, :assignee_name,
             :organization_id, :organization_name, :is_overdue, :is_completed, :time_remaining
  has_one :user
  has_many :subtasks

  # タグリストを配列として返す
  def tag_list
    object.tag_list
  end

  # 担当者の名前を返す（存在する場合）
  def assignee_name
    return nil if object.assigned_to.blank?
    
    # ユーザーオブジェクトがすでに読み込まれている場合は、そのオブジェクトを使用
    # これによりN+1クエリを防ぐ
    if object.association(:user).loaded? && object.user.present?
      return object.user.name
    end
    
    # 関連のプリロードがされていない場合は、キャッシュを使用してクエリを最小化
    Rails.cache.fetch("user_name/#{object.assigned_to}", expires_in: 1.hour) do
    user = User.find_by(id: object.assigned_to)
    user&.name
    end
  end
  
  # チーム名を返す（存在する場合）
  def organization_name
    return nil if object.organization_id.blank?
    
    # チームオブジェクトがすでに読み込まれている場合は、そのオブジェクトを使用
    # これによりN+1クエリを防ぐ
    if object.association(:organization).loaded? && object.organization.present?
      return object.organization.name
    end
    
    # 関連のプリロードがされていない場合は、キャッシュを使用してクエリを最小化
    Rails.cache.fetch("organization_name/#{object.organization_id}", expires_in: 1.hour) do
    organization = Organization.find_by(id: object.organization_id)
    organization&.name
    end
  end
  
  # タスクが期限切れかどうか
  def is_overdue
    object.overdue?
  end
  
  # タスクが完了しているかどうか
  def is_completed
    object.completed?
  end
  
  # タスクの残り時間（日数）を返す
  def time_remaining
    return nil if object.due_date.blank?
    
    if object.due_date < Date.current
      return -1 * (Date.current - object.due_date).to_i
    else
      return (object.due_date - Date.current).to_i
    end
  end
end 
