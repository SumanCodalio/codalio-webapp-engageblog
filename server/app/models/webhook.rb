# frozen_string_literal: true

class Webhook < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :url, :status
  rhino_sorts :organization_id, :url, :status, :created_at
  rhino_fields :id, :organization_id, :url, :events, :status, :created_at
  rhino_includes :organization
  validates :url, length: { maximum: 255 }, allow_nil: true
  validates :status, length: { maximum: 255 }, allow_nil: true
end
