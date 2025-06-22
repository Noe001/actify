class TeamMessageRead < ApplicationRecord
  before_create :set_uuid

  belongs_to :team_message
  belongs_to :user

  validates :user_id, uniqueness: { scope: :team_message_id }
  validates :read_at, presence: true

  # スコープ
  scope :recent, -> { order(read_at: :desc) }
  scope :by_user, ->(user) { where(user: user) }
  scope :for_channel, ->(channel) { 
    joins(:team_message).where(team_messages: { team_channel: channel }) 
  }

  private

  def set_uuid
    self.id = SecureRandom.uuid if self.id.nil?
  end
end 
