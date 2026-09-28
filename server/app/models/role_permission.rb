# frozen_string_literal: true

class RolePermission < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :capability, :role_key, :enabled
  rhino_sorts :organization_id, :capability, :role_key, :enabled, :created_at
  rhino_fields :id, :organization_id, :capability, :description, :role_key, :enabled, :created_at
  rhino_includes :organization
  validates :capability, length: { maximum: 255 }, allow_nil: true
  validates :role_key, length: { maximum: 255 }, allow_nil: true
  validates :enabled, inclusion: { in: [true, false] }, allow_nil: true
end
