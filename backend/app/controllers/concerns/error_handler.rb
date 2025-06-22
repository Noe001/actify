module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :handle_internal_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
  end

  private

  def handle_internal_error(error)
    Rails.logger.error "Internal Server Error: #{error.class} - #{error.message}"
    Rails.logger.error error.backtrace.join("\n")

    render json: {
      success: false,
      message: Rails.env.production? ? 'サーバーエラーが発生しました' : error.message,
      code: 'INTERNAL_SERVER_ERROR',
      errors: [],
      timestamp: Time.current.iso8601
    }, status: :internal_server_error
  end

  def handle_not_found(error)
    render json: {
      success: false,
      message: 'リソースが見つかりません',
      code: 'NOT_FOUND',
      errors: [],
      timestamp: Time.current.iso8601
    }, status: :not_found
  end

  def handle_validation_error(error)
    render json: {
      success: false,
      message: 'バリデーションエラーが発生しました',
      code: 'VALIDATION_ERROR',
      errors: error.record.errors.full_messages,
      timestamp: Time.current.iso8601
    }, status: :unprocessable_entity
  end

  def handle_parameter_missing(error)
    render json: {
      success: false,
      message: "必須パラメータが不足しています: #{error.param}",
      code: 'PARAMETER_MISSING',
      errors: [error.message],
      timestamp: Time.current.iso8601
    }, status: :bad_request
  end

  def handle_forbidden(message = 'アクセス権限がありません')
    render json: {
      success: false,
      message: message,
      code: 'FORBIDDEN',
      errors: [],
      timestamp: Time.current.iso8601
    }, status: :forbidden
  end
end 
