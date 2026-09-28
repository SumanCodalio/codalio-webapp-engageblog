# frozen_string_literal: true

class AnalyticsData < Rhino::RhinoModel
  include Rhino::BelongsToOrganization

  belongs_to :post, class_name: 'Post', optional: true

  rhino_filters :organization_id, :post_id, :event_type, :visitor_id, :recorded_at
  rhino_sorts :organization_id, :post_id, :event_type, :visitor_id, :recorded_at, :created_at
  rhino_fields :id, :organization_id, :post_id, :event_type, :visitor_id, :event_data, :recorded_at, :created_at
  rhino_includes :organization, :post

  # Required blueprint fields (nullable: false, no default) reject nil/blank.
  validates :event_type, presence: true, length: { maximum: 255 }
  validates :recorded_at, presence: true
  validates :visitor_id, length: { maximum: 255 }, allow_nil: true

  before_validation :default_recorded_at

  private

  # Extra 8: a recorded event defaults its timestamp when the client omits it.
  def default_recorded_at
    self.recorded_at ||= Time.current
  end
end
