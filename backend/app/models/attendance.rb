class Attendance < ApplicationRecord
  belongs_to :user
  belongs_to :workspace, optional: true

  validates :date, presence: true, uniqueness: { scope: :user_id }
  validates :status, presence: true, inclusion: { in: %w[pending present absent late half_day holiday] }
  validate :check_out_after_check_in, if: -> { check_in.present? && check_out.present? }

  before_save :calculate_hours, if: -> { check_in_changed? || check_out_changed? }

  scope :current_month, -> { where(date: Date.current.beginning_of_month..Date.current.end_of_month) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  private

  def check_out_after_check_in
    if check_out <= check_in
      errors.add(:check_out, "出勤時刻より後の時刻を設定してください")
    end
  end

  def calculate_hours
    if check_in.present? && check_out.present?
      check_in_time = check_in.seconds_since_midnight
      check_out_time = check_out.seconds_since_midnight
      seconds_diff = check_out_time - check_in_time
      
      # 負の値になる場合（日をまたぐ場合）は24時間を加算
      seconds_diff += 24 * 3600 if seconds_diff < 0
      
      self.total_hours = (seconds_diff / 3600.0).round(2)
      self.overtime_hours = [total_hours - 8.0, 0].max.round(2)
    end
  end
end 
