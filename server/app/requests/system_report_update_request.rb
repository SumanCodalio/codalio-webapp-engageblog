# frozen_string_literal: true

# Validation for PUT /{resource}/:id on SystemReport.
class SystemReportUpdateRequest < Rhino::ResourceRequest
  attribute :report_type, :string
  attribute :parameters
  attribute :status, :string
  attribute :generated_at, :datetime
  attribute :summary

  validates :report_type, presence: true, if: -> { input.key?("report_type") }
  validates :report_type, length: { maximum: 255 }, allow_nil: true
end
