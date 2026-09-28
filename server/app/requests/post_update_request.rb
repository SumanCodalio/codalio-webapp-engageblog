# frozen_string_literal: true

# Validation for PUT /{resource}/:id on Post.
#
# Partial updates: only the fields the client sends are validated. `title` is
# required only when present (a partial update may omit it).
class PostUpdateRequest < Rhino::ResourceRequest
  attribute :title, :string
  attribute :slug, :string
  attribute :content, :string
  attribute :category, :string
  attribute :tags
  attribute :status, :string
  attribute :read_time_minutes, :integer
  attribute :published_at, :datetime
  attribute :scheduled_at, :datetime
  attribute :user_id, :integer

  validates :title, presence: true, if: -> { input.key?("title") }
  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[draft published scheduled] }, allow_nil: true
  validates :read_time_minutes, numericality: { only_integer: true }, allow_nil: true

  validate :scheduled_requires_scheduled_at

  private

  def scheduled_requires_scheduled_at
    return unless status == "scheduled"
    return if scheduled_at.present? || record&.scheduled_at.present?

    errors.add(:scheduled_at, "can't be blank when status is scheduled")
  end
end
