class Api::TeamChatController < ApplicationController
  before_action :authenticate_user!
  before_action :set_team
  before_action :ensure_team_member
  before_action :set_channel, except: [:channels, :create_channel]
  before_action :set_message, only: [:show_message, :edit_message, :delete_message, :reply_message]

  # GET /api/teams/:team_id/chat/channels
  def channels
    channels = @team.team_channels.active.includes(:created_by)
                   .recent_activity
    
    channels_data = channels.map do |channel|
      {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        channel_type: channel.channel_type,
        created_by: {
          id: channel.created_by.id,
          name: channel.created_by.name
        },
        unread_count: channel.unread_count_for(current_user),
        last_message_at: channel.last_message_at,
        message_count: channel.message_count,
        stats: channel.stats
      }
    end

    render json: {
      success: true,
      data: channels_data,
      message: 'チャンネル一覧を取得しました'
    }
  end

  # POST /api/teams/:team_id/chat/channels
  def create_channel
    channel = @team.team_channels.build(channel_params)
    channel.created_by = current_user

    if channel.save
      # システムメッセージを作成
      TeamMessage.create_system_message(
        channel,
        "#{current_user.name}がチャンネル「#{channel.name}」を作成しました",
        { action: 'channel_created', user_id: current_user.id }
      )

      render json: {
        success: true,
        data: channel,
        message: 'チャンネルを作成しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: 'チャンネルの作成に失敗しました',
        errors: channel.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/teams/:team_id/chat/channels/:channel_id/messages
  def messages
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 50).to_i
    
    messages = @channel.latest_messages(per_page * page)
    
    # メッセージを既読にマーク
    @channel.mark_messages_as_read(current_user)

    messages_data = messages.map(&:detailed_info)

    render json: {
      success: true,
      data: messages_data,
      meta: {
        page: page,
        per_page: per_page,
        total_messages: @channel.message_count
      },
      message: 'メッセージ一覧を取得しました'
    }
  end

  # POST /api/teams/:team_id/chat/channels/:channel_id/messages
  def send_message
    content = params[:content]
    message_type = params[:message_type] || 'text'
    files = params[:files]

    if files.present?
      message = TeamMessage.create_file_message(@channel, current_user, files, content)
    else
      message = @channel.send_message(current_user, content, message_type)
    end

    if message.persisted?
      render json: {
        success: true,
        data: message.detailed_info,
        message: 'メッセージを送信しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: 'メッセージの送信に失敗しました',
        errors: message.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/teams/:team_id/chat/messages/:message_id
  def show_message
    render json: {
      success: true,
      data: @message.detailed_info,
      message: 'メッセージ詳細を取得しました'
    }
  end

  # PUT /api/teams/:team_id/chat/messages/:message_id
  def edit_message
    new_content = params[:content]

    if @message.edit_content(new_content, current_user)
      render json: {
        success: true,
        data: @message.detailed_info,
        message: 'メッセージを編集しました'
      }
    else
      render json: {
        success: false,
        message: 'メッセージの編集に失敗しました'
      }, status: :forbidden
    end
  end

  # DELETE /api/teams/:team_id/chat/messages/:message_id
  def delete_message
    if @message.soft_delete!(current_user)
      render json: {
        success: true,
        message: 'メッセージを削除しました'
      }
    else
      render json: {
        success: false,
        message: 'メッセージの削除に失敗しました'
      }, status: :forbidden
    end
  end

  # POST /api/teams/:team_id/chat/messages/:message_id/reply
  def reply_message
    content = params[:content]
    message_type = params[:message_type] || 'text'

    reply = @message.reply(current_user, content, message_type)

    if reply.persisted?
      render json: {
        success: true,
        data: reply.detailed_info,
        message: '返信を送信しました'
      }, status: :created
    else
      render json: {
        success: false,
        message: '返信の送信に失敗しました',
        errors: reply.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/teams/:team_id/chat/channels/:channel_id/mark_read
  def mark_read
    @channel.mark_messages_as_read(current_user)
    
    render json: {
      success: true,
      message: 'メッセージを既読にしました'
    }
  end

  # DELETE /api/teams/:team_id/chat/channels/:channel_id
  def archive_channel
    if @channel.archive!
      render json: {
        success: true,
        message: 'チャンネルをアーカイブしました'
      }
    else
      render json: {
        success: false,
        message: 'チャンネルのアーカイブに失敗しました'
      }, status: :internal_server_error
    end
  end

  private

  def set_team
    @team = Team.find(params[:team_id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'チームが見つかりません'
    }, status: :not_found
  end

  def ensure_team_member
    unless @team.member?(current_user)
      render json: {
        success: false,
        message: 'チームメンバーのみアクセス可能です'
      }, status: :forbidden
    end
  end

  def set_channel
    @channel = @team.team_channels.find(params[:channel_id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'チャンネルが見つかりません'
    }, status: :not_found
  end

  def set_message
    channel_id = params[:channel_id] || @message&.team_channel_id
    if channel_id
      @message = TeamMessage.joins(:team_channel)
                           .where(team_channels: { id: channel_id, team: @team })
                           .find(params[:message_id])
    else
      @message = TeamMessage.joins(:team_channel)
                           .where(team_channels: { team: @team })
                           .find(params[:message_id])
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'メッセージが見つかりません'
    }, status: :not_found
  end

  def channel_params
    params.require(:channel).permit(:name, :description, :channel_type)
  end
end 
