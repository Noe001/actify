class Api::OrganizationsController < ApplicationController
  before_action :authenticate_user

  # GET /api/organizations
  def index
    @organizations = current_user.organizations
    render json: @organizations
  end

  # GET /api/organizations/:id
  def show
    @organization = Organization.find(params[:id])
    
    # ユーザーがこのチームのメンバーかチェック
    unless @organization.member?(current_user)
      return render json: { error: '権限がありません' }, status: :forbidden
    end
    
    render json: @organization
  end

  # POST /api/organizations
  def create
    @organization = current_user.create_organization(
      organization_params[:name],
      organization_params[:description]
    )
    
    render json: @organization, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /api/organizations/join
  def join
    @organization = Organization.find(params[:organization_id])
    
    # 既に所属している場合はエラー
    if @organization.member?(current_user)
      return render json: { error: '既にこのチームに所属しています' }, status: :unprocessable_entity
    end
    
    current_user.join_organization(@organization)
    render json: @organization
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'チームが見つかりませんでした' }, status: :not_found
  end

  private

  def organization_params
    params.require(:organization).permit(:name, :description)
  end
end
