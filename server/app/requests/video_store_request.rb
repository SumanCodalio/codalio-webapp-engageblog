# frozen_string_literal: true

# Validation for POST /{resource} on Video.
#
# `title` and `url` are required (nullable: false in the blueprint).
class VideoStoreRequest < Rhino::ResourceRequest
  attribute :title, :string
  attribute :description, :string
  attribute :url, :string
  attribute :media_type, :string
  attribute :format, :string
  attribute :file_size, :string
  attribute :resolution, :string
  attribute :bitrate, :string
  attribute :thumbnail_url, :string
  attribute :duration_seconds, :integer
  attribute :status, :string
  attribute :post_id, :integer
  attribute :user_id, :integer

  validates :title, presence: true, length: { maximum: 255 }
  validates :url, presence: true
  validates :media_type, inclusion: { in: %w[video image audio] }, allow_nil: true
  validates :duration_seconds, numericality: { only_integer: true }, allow_nil: true
end
