class ApplicationController < ActionController::API
  include ActionController::Cookies
  
  attr_reader :current_user

  # 共通エラーハンドリング
  rescue_from StandardError, with: :handle_internal_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error

  # 認証エラーコード定数
  module AuthErrorCodes
    AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED'    # 認証が必要
    TOKEN_MISSING = 'TOKEN_MISSING'                        # トークンが存在しない
    TOKEN_INVALID = 'TOKEN_INVALID'                        # トークンが無効
    TOKEN_EXPIRED = 'TOKEN_EXPIRED'                        # トークンが期限切れ
    TOKEN_MALFORMED = 'TOKEN_MALFORMED'                    # トークンの形式が不正
    USER_NOT_FOUND = 'USER_NOT_FOUND'                      # ユーザーが見つからない
    SESSION_EXPIRED = 'SESSION_EXPIRED'                    # セッションが期限切れ
  end

  private

  # N+1問題対策：ユーザーをチーム関連データとともに取得
  def find_user_with_organizations(user_id)
    User.includes(organization_memberships: :organization).find(user_id)
  end

  # N+1問題対策：現在のユーザーをチーム関連データとともに取得
  def current_user_with_organizations
    return nil unless current_user
    @current_user_with_organizations ||= find_user_with_organizations(current_user.id)
  end

  # セッションからユーザーを取得
  def current_user_from_session
    if session[:user_id]
      @current_user ||= User.find_by(id: session[:user_id])
    end
  end

  # セッションベースの認証
  def authenticate_user_from_session
    current_user_from_session || authentication_error(AuthErrorCodes::SESSION_EXPIRED, 'セッションが期限切れです')
  end

  # リクエストからJWTトークンを取得し、ユーザーを認証する
  def authenticate_user
    # 開発環境での安全な認証バイパス（環境変数による制御）
    if Rails.env.development? && ENV['DEVELOPMENT_AUTH_BYPASS'] == 'true'
      @current_user = get_development_user
      return @current_user.present?
    end

    # まずセッションから認証を試みる
    if current_user_from_session
      @current_user = current_user_from_session
      return true
    end

    token = extract_token_from_header
    if token.blank?
      @auth_error_code = AuthErrorCodes::TOKEN_MISSING
      @auth_error_message = '認証トークンが提供されていません'
      return false
    end
    
    result = authenticate_with_jwt(token)
    @current_user = result[:user]
    
    if result[:error]
      @auth_error_code = result[:error_code]
      @auth_error_message = result[:error_message]
      return false
    end
    
    @current_user.present?
  end

  # 必須認証メソッド - コントローラーで認証を必須にする
  def authenticate_user!
    return true if authenticate_user
    
    # 認証失敗時のエラーコードとメッセージを使用
    code = @auth_error_code || AuthErrorCodes::AUTHENTICATION_REQUIRED
    message = @auth_error_message || '認証が必要です'
    authentication_error(code, message)
  end

  # 認証エラーのレスポンスを返す（詳細なエラーコード対応）
  def authentication_error(code = AuthErrorCodes::AUTHENTICATION_REQUIRED, message = '認証が必要です')
    render json: { 
      success: false, 
      message: message,
      code: code,
      timestamp: Time.current.iso8601
    }, status: :unauthorized
    false
  end

  # 統一されたエラーハンドリング
  def handle_error(error, message = 'エラーが発生しました', status = :internal_server_error)
    log_error(error)
    
    render json: {
      success: false,
      message: message,
      code: error.class.name,
      errors: extract_error_details(error),
      timestamp: Time.current.iso8601
    }, status: status
  end

  # 内部サーバーエラー
  def handle_internal_error(error)
    handle_error(error, 'サーバー内部エラーが発生しました', :internal_server_error)
  end

  # レコードが見つからない
  def handle_not_found(error)
    handle_error(error, 'リソースが見つかりません', :not_found)
  end

  # バリデーションエラー
  def handle_validation_error(error)
    handle_error(error, 'データの形式が正しくありません', :unprocessable_entity)
  end

  # 成功レスポンスの統一
  def render_success(data = nil, message = '成功しました', status = :ok)
    response = {
      success: true,
      message: message,
      timestamp: Time.current.iso8601
    }
    response[:data] = data if data.present?
    
    render json: response, status: status
  end

  # 失敗レスポンスの統一
  def render_error(message = 'エラーが発生しました', errors = [], status = :bad_request)
    render json: {
      success: false,
      message: message,
      errors: errors,
      timestamp: Time.current.iso8601
    }, status: status
  end

  private

  # 開発環境用のユーザー取得（安全な実装）
  def get_development_user
    # 環境変数で指定されたユーザーIDを使用（フォールバックあり）
    user_id = ENV['DEVELOPMENT_USER_ID']
    
    if user_id.present?
      User.find_by(id: user_id)
    else
      # フォールバック：最初のユーザーを使用
      User.first
    end
  end

  # ヘッダーからトークンを抽出
  def extract_token_from_header
    header = request.headers['Authorization']
    return nil unless header
    
    if header.start_with?('Bearer ')
      header.split(' ').last
    else
      header
    end
  end

  # JWTトークンでユーザーを認証（詳細なエラー情報付き）
  def authenticate_with_jwt(token)
    begin
      decoded = JWTConfig.decode(token)
      
      unless decoded
        return {
          user: nil,
          error: true,
          error_code: AuthErrorCodes::TOKEN_INVALID,
          error_message: 'トークンが無効です'
        }
      end
      
      payload = decoded.first
      user_id = payload['user_id'].to_s
      
      # トークンの有効期限チェック
      if payload['exp'] && Time.at(payload['exp']) <= Time.current
        return {
          user: nil,
          error: true,
          error_code: AuthErrorCodes::TOKEN_EXPIRED,
          error_message: 'トークンの有効期限が切れています'
        }
      end
      
      user = User.find_by(id: user_id)
      unless user
        return {
          user: nil,
          error: true,
          error_code: AuthErrorCodes::USER_NOT_FOUND,
          error_message: 'ユーザーが見つかりません'
        }
      end
      
      { user: user, error: false }
      
    rescue JWT::ExpiredSignature
      {
        user: nil,
        error: true,
        error_code: AuthErrorCodes::TOKEN_EXPIRED,
        error_message: 'トークンの有効期限が切れています'
      }
    rescue JWT::InvalidSignature
      {
        user: nil,
        error: true,
        error_code: AuthErrorCodes::TOKEN_INVALID,
        error_message: 'トークンの署名が無効です'
      }
    rescue JWT::DecodeError, JWT::InvalidJtiError, JWT::InvalidIssuerError, JWT::InvalidAudienceError
      {
        user: nil,
        error: true,
        error_code: AuthErrorCodes::TOKEN_MALFORMED,
        error_message: 'トークンの形式が正しくありません'
      }
    rescue => e
      Rails.logger.error "JWT authentication failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n") if e.backtrace
      {
        user: nil,
        error: true,
        error_code: AuthErrorCodes::TOKEN_INVALID,
        error_message: 'トークンの処理中にエラーが発生しました'
      }
    end
  end

  # エラーログの出力
  def log_error(error)
    Rails.logger.error "#{self.class.name}##{action_name}: #{error.message}"
    Rails.logger.error error.backtrace.join("\n") if error.backtrace
  end

  # エラー詳細の抽出
  def extract_error_details(error)
    case error
    when ActiveRecord::RecordInvalid
      error.record.errors.full_messages
    when ActiveModel::ValidationError
      error.model.errors.full_messages
    else
      []
    end
  end
end
