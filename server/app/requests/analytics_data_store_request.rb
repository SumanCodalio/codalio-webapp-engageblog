# frozen_string_literal: true

# Validation for POST /{resource} on AnalyticsData.
#
# Extra 8: a view event is recorded with a visitor_id so unique readers can be
# counted. `event_type` and `recorded_at` are required (nullable: false in the
# blueprint); `recorded_at` defaults to now when the client omits it.
class AnalyticsDataStoreRequest < Rhino::ResourceRequest
  attribute :post_id, :integer
  attribute :event_type, :string
  attribute :visitor_id, :string
  attribute :event_data
  attribute :recorded_at, :datetime

  validates :event_type, presence: true, length: { maximum: 255 }
  validates :recorded_at, presence: true

  def prepare(input)
    input["recorded_at"] ||= Time.current.iso8601
    input
  end
end
