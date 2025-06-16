class LeaveRequest < ApplicationRecord
  belongs_to :user
  belongs_to :workspace, optional: true

  validates :leave_type, presence: true, inclusion: { in: %w[paid sick other] }
  validates :start_date, :end_date, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending approved rejected] }
  validate :end_date_after_start_date
  validate :dates_not_in_past, on: :create

  scope :current_year, -> { where('start_date >= ? OR end_date >= ?', Date.current.beginning_of_year, Date.current.beginning_of_year) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }

  def duration_days
    (end_date - start_date).to_i + 1
  end

  private

  def end_date_after_start_date
    if start_date.present? && end_date.present? && end_date < start_date
      errors.add(:end_date, "は開始日より後でなければなりません")
    end
  end

  def dates_not_in_past
    if start_date.present? && start_date < Date.current
      errors.add(:start_date, "は今日以降の日付でなければなりません")
    end
  end
end 
