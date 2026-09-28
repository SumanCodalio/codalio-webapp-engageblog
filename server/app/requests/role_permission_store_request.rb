# frozen_string_literal: true

# Validation for POST /{resource} on RolePermission. `capability` and `role_key` are required.
class RolePermissionStoreRequest < Rhino::ResourceRequest
  attribute :capability, :string
  attribute :description, :string
  attribute :role_key, :string
  attribute :enabled, :boolean

  validates :capability, presence: true, length: { maximum: 255 }
  validates :role_key, presence: true, length: { maximum: 255 }
  validates :enabled, inclusion: { in: [true, false] }, allow_nil: true
end
