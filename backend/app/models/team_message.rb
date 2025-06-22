class TeamMessage < ApplicationRecord
  before_create :set_uuid
  after_initialize :set_defaults

  belongs_to :team_channel
  belongs_to :user
  belongs_to :parent_message, class_name: 'TeamMessage', optional: true
  has_many :replies, class_name: 'TeamMessage', foreign_key: 'parent_message_id', dependent: :destroy
  has_many :team_message_reads, dependent: :destroy
  has_many_attached :files

  validates :content, presence: true
  validates :message_type, inclusion: { in: %w[text file image system] }

  # メッセージタイプの定数
  MESSAGE_TYPES = %w[text file image system].freeze

  # スコープ
  scope :active, -> { where(is_deleted: false) }
  scope :deleted, -> { where(is_deleted: true) }
  scope :by_type, ->(type) { where(message_type: type) }
  scope :recent, -> { order(created_at: :desc) }
  scope :replies_to, ->(message) { where(parent_message: message) }
  scope :root_messages, -> { where(parent_message_id: nil) }

  # ユーザーによって既読にマーク
  def mark_as_read_by(user)
    return if user == self.user # 自分のメッセージは既読不要

    team_message_reads.find_or_create_by(user: user) do |read|
      read.read_at = Time.current
    end
  end

  # ユーザーが既読かどうか
  def read_by?(user)
    return true if user == self.user # 自分のメッセージは既読扱い
    team_message_reads.exists?(user: user)
  end

  # メッセージを編集
  def edit_content(new_content, edited_by = nil)
    return false unless edited_by == user || team_channel.team.admin?(edited_by)

    update!(
      content: new_content,
      is_edited: true,
      edited_at: Time.current
    )
  end

  # メッセージを削除（論理削除）
  def soft_delete!(deleted_by = nil)
    return false unless deleted_by == user || team_channel.team.admin?(deleted_by)

    update!(
      is_deleted: true,
      deleted_at: Time.current,
      content: '[削除されたメッセージ]'
    )
  end

  # メッセージに返信
  def reply(user, content, message_type = 'text')
    team_channel.team_messages.create!(
      user: user,
      content: content,
      message_type: message_type,
      parent_message: self
    )
  end

  # 返信があるかどうか
  def has_replies?
    replies.active.exists?
  end

  # 返信数
  def reply_count
    replies.active.count
  end

  # メッセージの詳細情報（API用）
  def detailed_info
    {
      id: id,
      content: content,
      message_type: message_type,
      user: {
        id: user.id,
        name: user.name,
        avatar_url: user.avatarUrl
      },
      parent_message_id: parent_message_id,
      reply_count: reply_count,
      is_edited: is_edited,
      edited_at: edited_at,
      created_at: created_at,
      files: files.attached? ? files.map { |file| 
        {
          id: file.id,
          filename: file.filename.to_s,
          content_type: file.content_type,
          byte_size: file.byte_size,
          url: Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
        }
      } : []
    }
  end

  # システムメッセージを作成
  def self.create_system_message(channel, content, metadata = {})
    create!(
      team_channel: channel,
      user: channel.team.leader || channel.created_by,
      content: content,
      message_type: 'system',
      metadata: metadata
    )
  end

  # ファイル添付メッセージを作成
  def self.create_file_message(channel, user, files, content = '')
    message = create!(
      team_channel: channel,
      user: user,
      content: content.present? ? content : "#{files.size}個のファイルを共有しました",
      message_type: files.any? { |f| f.content_type&.start_with?('image/') } ? 'image' : 'file'
    )

    message.files.attach(files)
    message
  end

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end

  def set_defaults
    self.metadata ||= {}
  end
end 
 