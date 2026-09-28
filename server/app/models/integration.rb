# frozen_string_literal: true

class Integration < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :name, :category, :connected, :client_id, :api_key, :auto_sync
  rhino_sorts :organization_id, :name, :category, :connected, :client_id, :api_key, :auto_sync, :created_at
  rhino_fields :id, :organization_id, :name, :category, :description, :connected, :client_id, :api_key, :auto_sync, :created_at
  rhino_includes :organization
  validates :name, length: { maximum: 255 }, allow_nil: true
  validates :category, length: { maximum: 255 }, allow_nil: true
  validates :connected, inclusion: { in: [true, false] }, allow_nil: true
  validates :client_id, length: { maximum: 255 }, allow_nil: true
  validates :api_key, length: { maximum: 255 }, allow_nil: true
  validates :auto_sync, inclusion: { in: [true, false] }, allow_nil: true
end
