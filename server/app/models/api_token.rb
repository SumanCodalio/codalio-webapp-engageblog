# frozen_string_literal: true

class ApiToken < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :name, :token_prefix, :last_used_at
  rhino_sorts :organization_id, :name, :token_prefix, :last_used_at, :created_at
  rhino_fields :id, :organization_id, :name, :token_prefix, :last_used_at, :created_at
  rhino_includes :organization
  validates :name, length: { maximum: 255 }, allow_nil: true
  validates :token_prefix, length: { maximum: 255 }, allow_nil: true
end
