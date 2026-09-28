# frozen_string_literal: true

class SystemReport < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :report_type, :status, :generated_at
  rhino_sorts :organization_id, :report_type, :status, :generated_at, :created_at
  rhino_fields :id, :organization_id, :report_type, :parameters, :status, :generated_at, :summary, :created_at
  rhino_includes :organization
  validates :report_type, length: { maximum: 255 }, allow_nil: true
  validates :status, length: { maximum: 255 }, allow_nil: true

  before_validation :default_generated_at

  private

  # A newly generated report stamps its own timestamp when the client omits it,
  # so the archive table always shows when a report was produced.
  def default_generated_at
    self.generated_at ||= Time.current
  end
end
