# frozen_string_literal: true

# Validation for PUT /{resource}/:id on RolePermission.
class RolePermissionUpdateRequest < Rhino::ResourceRequest
  attribute :capability, :string
  attribute :description, :string
  attribute :role_key, :string
  attribute :enabled, :boolean

  validates :capability, presence: true, if: -> { input.key?("capability") }
  validates :capability, length: { maximum: 255 }, allow_nil: true
  validates :role_key, presence: true, if: -> { input.key?("role_key") }
  validates :role_key, length: { maximum: 255 }, allow_nil: true
  validates :enabled, inclusion: { in: [true, false] }, allow_nil: true
end
