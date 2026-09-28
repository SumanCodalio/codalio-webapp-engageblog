# frozen_string_literal: true

class Video < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Discard::Model
  include AssignsCurrentUser

  belongs_to :user, class_name: 'User'
  belongs_to :post, class_name: 'Post', optional: true

  rhino_filters :user_id, :post_id, :title, :media_type, :format, :status
  rhino_sorts :user_id, :post_id, :title, :media_type, :format, :duration_seconds, :status, :created_at
  rhino_default_sort '-created_at'
  rhino_fields :id, :organization_id, :user_id, :post_id, :title, :description, :url, :media_type,
               :format, :file_size, :resolution, :bitrate, :thumbnail_url, :duration_seconds,
               :status, :created_at
  rhino_includes :user, :post
  rhino_search :title, :description
  rhino_pagination_enabled true
  rhino_per_page 25

  validates :title, presence: true, length: { maximum: 255 }
  validates :url, presence: true
  validates :media_type, inclusion: { in: %w[video image audio] }, allow_nil: true
  validates :duration_seconds, numericality: { only_integer: true }, allow_nil: true

  # Extra 6: MM:SS display string derived from duration_seconds.
  # `Kernel.format` is used explicitly because the model has a `format` column
  # whose reader would otherwise shadow the Kernel method.
  def duration
    return nil if duration_seconds.nil?

    minutes = duration_seconds / 60
    seconds = duration_seconds % 60
    Kernel.format('%<m>02d:%<s>02d', m: minutes, s: seconds)
  end

  def rhino_computed_attributes
    { 'duration' => duration }
  end
end
