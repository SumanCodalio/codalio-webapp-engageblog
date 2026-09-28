# frozen_string_literal: true

# Validation for POST /{resource} on Post.
#
# `title` is required (nullable: false in the blueprint). The publish transition
# and slug generation live on the model; this class owns the write shape.
class PostStoreRequest < Rhino::ResourceRequest
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

  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[draft published scheduled] }, allow_nil: true
  validates :read_time_minutes, numericality: { only_integer: true }, allow_nil: true

  validate :scheduled_requires_scheduled_at

  private

  def scheduled_requires_scheduled_at
    return unless status == "scheduled"
    return if scheduled_at.present?

    errors.add(:scheduled_at, "can't be blank when status is scheduled")
  end
end
