class Api::InvitationsController < ApplicationController
  before_action :authenticate_user, except: [:validate]
  before_action :set_organization, only: [:create, :index]
  before_action :check_admin_permission, only: [:create, :delete]
  before_action :set_invitation, only: [:show, :delete]

  # POST /api/organizations/:organization_id/invitations
  def create
    expires_in = params[:expires_in].present? ? params[:expires_in].to_i : 24
    uses_allowed = params[:uses_allowed].present? ? params[:uses_allowed].to_i : nil

    if params[:permanent]
      @invitation = Invitation.create_permanent(@organization, current_user.id)
    else
      @invitation = Invitation.create_with_expiry(@organization, current_user.id, expires_in, uses_allowed)
    end

    if @invitation.persisted?
      render json: @invitation, status: :created
    else
      render json: { error: @invitation.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # GET /api/organizations/:organization_id/invitations
  def index
    @invitations = @organization.invitations
    render json: @invitations
  end

  # GET /api/invitations/:id
  def show
    render json: @invitation
  end

  # DELETE /api/invitations/:id
  def delete
    @invitation.destroy
    head :no_content
  end

  # GET /api/invitations/validate/:code
  def validate
    @invitation = Invitation.find_by(code: params[:code])
    
    if @invitation.nil?
      return render json: { valid: false, error: '招待コードが無効です' }, status: :not_found
    end

    if !@invitation.valid_for_use?
      return render json: { valid: false, error: '招待コードが期限切れか使用回数オーバーです' }, status: :unprocessable_entity
    end

    render json: { 
      valid: true, 
      organization: { 
        id: @invitation.organization.id,
        name: @invitation.organization.name,
        description: @invitation.organization.description
      } 
    }
  end

  # POST /api/invitations/use/:code
  def use
    @invitation = Invitation.find_by(code: params[:code])
    
    if @invitation.nil?
      return render json: { error: '招待コードが無効です' }, status: :not_found
    end

    if !@invitation.valid_for_use?
      return render json: { error: '招待コードが期限切れか使用回数オーバーです' }, status: :unprocessable_entity
    end

    # 既に所属している場合はエラー
    if @invitation.organization.member?(current_user)
      return render json: { error: '既にこのチームに所属しています' }, status: :unprocessable_entity
    end
    
    @invitation.increment_usage!
    current_user.join_organization(@invitation.organization)
    
    render json: @invitation.organization
  end

  private

  def set_organization
    @organization = Organization.find(params[:organization_id])
  end

  def set_invitation
    @invitation = Invitation.find(params[:id])
  end
  
  def check_admin_permission
    unless @organization.admin?(current_user)
      render json: { error: '管理者権限が必要です' }, status: :forbidden
    end
  end
end
