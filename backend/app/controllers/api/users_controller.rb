class Api::UsersController < ApplicationController
  before_action :authenticate_user!, except: [:index]
  before_action :set_user, only: [:show, :update, :destroy, :update_profile]
  before_action :verify_profile_ownership, only: [:update, :destroy, :update_profile]

  def index
    render json: User.all
  end

  def show
    # N+1問題を防ぐためにeager loadingを実行
    user_with_organizations = find_user_with_organizations(@user.id)
    render json: user_with_organizations, serializer: UserSerializer
  end

  # ユーザー情報更新（管理者用）
  def update
    if @user.update(user_params)
      # 更新後に関連データを再ロード
      user_with_organizations = find_user_with_organizations(@user.id)
      render_success(
        UserSerializer.new(user_with_organizations),
        'ユーザー情報が正常に更新されました。'
      )
    else
      render_error(
        'ユーザー情報の更新に失敗しました。',
        @user.errors.full_messages,
        :unprocessable_entity
      )
    end
  end

  # ユーザー削除（管理者用）
  def destroy
    if @user.destroy
      render_success(nil, 'ユーザーが正常に削除されました。')
    else
      render_error(
        'ユーザーの削除に失敗しました。',
        @user.errors.full_messages,
        :unprocessable_entity
      )
    end
  end

  # プロフィール更新
  def update_profile
    # 入力データのサニタイゼーション
    sanitized_params = sanitize_profile_params(profile_params)
    
    if @user.update(sanitized_params)
      # 更新後に関連データを再ロード
      user_with_organizations = find_user_with_organizations(@user.id)
      render_success(
        UserSerializer.new(user_with_organizations),
        'プロフィールが正常に更新されました。'
      )
    else
      # バリデーションエラーの詳細な日本語メッセージを返す
      detailed_errors = @user.errors.full_messages
      
      render_error(
        'プロフィールの更新に失敗しました。',
        detailed_errors,
        :unprocessable_entity
      )
    end
  end

  private

  def set_user
    # N+1問題を防ぐためにeager loadingを実行
    if action_name == 'update_profile'
      @user = find_user_with_organizations(current_user.id)
    else
      user_id = params[:id] || current_user.id
      @user = find_user_with_organizations(user_id)
    end
  end

  def verify_profile_ownership
    case action_name
    when 'update_profile'
      unless @user == current_user
        render json: {
          success: false,
          message: '権限がありません。'
        }, status: :forbidden
      end
    when 'update', 'destroy'
      # 管理者または本人のみ操作可能
      unless current_user.role == 'admin' || @user == current_user
        render json: {
          success: false,
          message: '権限がありません。'
        }, status: :forbidden
      end
    end
  end

  def user_params
    params.permit(:name, :email, :role, :status, :department, :position, :bio, :avatarUrl)
  end

  def profile_params
    params.permit(:name, :email, :department, :position, :bio, :avatarUrl)
  end

  def sanitize_profile_params(params)
    sanitized = {}
    
    # HTMLタグを除去し、危険な文字をエスケープ
    sanitized[:name] = ActionController::Base.helpers.strip_tags(params[:name])&.strip if params[:name]
    sanitized[:email] = params[:email]&.strip&.downcase if params[:email]
    sanitized[:department] = ActionController::Base.helpers.strip_tags(params[:department])&.strip if params[:department]
    sanitized[:position] = ActionController::Base.helpers.strip_tags(params[:position])&.strip if params[:position]
    sanitized[:bio] = ActionController::Base.helpers.strip_tags(params[:bio])&.strip if params[:bio]
    
    # avatarUrlの処理
    sanitized[:avatarUrl] = params[:avatarUrl] if params[:avatarUrl]
    
    sanitized.compact
  end
end 
