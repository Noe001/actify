class Meeting < ApplicationRecord
  before_create :set_uuid
  
  # リレーションシップ
  has_many :meeting_participants, dependent: :destroy
  has_many :participants, through: :meeting_participants, source: :user
  belongs_to :organizer, class_name: 'User', foreign_key: 'organizer_id'
  belongs_to :workspace, optional: true
  
  # バリデーション
  validates :title, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :organizer_id, presence: true
  
  private
  
  def set_uuid
    self.id ||= SecureRandom.uuid
  end
end
