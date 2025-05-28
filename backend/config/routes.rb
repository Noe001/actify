Rails.application.routes.draw do
  # Active Storageのルートを明示的にマウント（これだけで十分です）
  mount ActiveStorage::Engine => "/rails/active_storage"
  
  # カスタムActiveStorageルート
  get '/storage/proxy/:signed_id/*filename', to: 'api/active_storage#proxy', as: :custom_blob_proxy
  get '/storage/download/:signed_id/*filename', to: 'api/active_storage#download', as: :custom_blob_download
  
  # API routes
  namespace :api do
    get "invitations/create"
    get "invitations/show"
    get "invitations/use"
    get "organizations/create"
    get "organizations/join"
    get "organizations/index"
    get "organizations/show"
    # 認証エンドポイント
    post '/signup', to: 'auth#signup'
    post '/login', to: 'auth#login'
    post 'auth/logout', to: 'auth#logout'
    get 'auth/me', to: 'auth#me'
    put 'auth/change-password', to: 'auth#change_password'
    
    # セッションベースの認証エンドポイント
    get '/sessions/new', to: 'sessions#new'
    post '/sessions', to: 'sessions#create'
    delete '/sessions', to: 'sessions#destroy'
    
    # マニュアル関連のエンドポイント
    resources :manuals do
      collection do
        get 'search'
        get 'categories'
        get 'my'  # 自分のマニュアル一覧
      end
    end
    
    # タスク関連のエンドポイント
    resources :tasks do
      collection do
        get :calendar
        get :dashboard
        get :my  # 自分のタスク一覧
        post :batch_update  # 複数タスクの一括更新
        put :reorder  # タスクの並び替え
      end
      
      member do
        put 'status', to: 'tasks#update_status'  # ステータス更新
        put 'assign', to: 'tasks#assign'  # 担当者変更
        put 'subtask/:subtask_id/toggle', to: 'tasks#toggle_subtask'  # サブタスクの完了状態切替
      end
    end
    
    # ミーティング関連のエンドポイント
    resources :meetings do
      resources :meeting_participants, only: [:index, :create, :destroy]
      collection do
        get 'my'  # 自分のミーティング一覧
      end
      
      member do
        post 'participants', to: 'meetings#add_participants'
        delete 'participants/:user_id', to: 'meetings#remove_participant'
      end
    end
    
    # ユーザー管理
    resources :users, only: [:index, :show, :update, :destroy]
    
    # プロフィール管理
    put '/profile', to: 'users#update_profile'
    
    # 組織関連
    resources :organizations do
      member do
        post :add_member
        delete :remove_member
      end
      
      # 組織に関連する招待
      resources :invitations, only: [:index, :create]
    end
    post '/organizations/join', to: 'organizations#join'
    
    # 招待関連
    resources :invitations, only: [:index, :create, :show, :destroy] do
      member do
        post :accept
        post :reject
      end
      collection do
        get 'validate/:code', to: 'invitations#validate'
        post 'use/:code', to: 'invitations#use'
      end
    end
    
    # 勤怠管理
    scope :attendance do
      get '/', to: 'attendance#index'
      post '/check-in', to: 'attendance#check_in'
      post '/check-out', to: 'attendance#check_out'
      put '/', to: 'attendance#update'
      post '/leave', to: 'attendance#request_leave'
      get '/history', to: 'attendance#history'
      get '/leave-history', to: 'attendance#leave_history'
      get '/summary', to: 'attendance#summary'
    end
  end
  
  # 画像ファイルアクセス用のルート
  get 'images/:filename', to: 'images#show'
end
