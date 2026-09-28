# frozen_string_literal: true

# Validation for POST /{resource} on SystemReport. `report_type` is required.
class SystemReportStoreRequest < Rhino::ResourceRequest
  attribute :report_type, :string
  attribute :parameters
  attribute :status, :string
  attribute :generated_at, :datetime
  attribute :summary

  validates :report_type, presence: true, length: { maximum: 255 }
end
