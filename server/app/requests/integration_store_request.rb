# frozen_string_literal: true

# Validation for POST /{resource} on Integration. `name` is required.
class IntegrationStoreRequest < Rhino::ResourceRequest
  attribute :name, :string
  attribute :category, :string
  attribute :description, :string
  attribute :connected, :boolean
  attribute :client_id, :string
  attribute :api_key, :string
  attribute :auto_sync, :boolean

  validates :name, presence: true, length: { maximum: 255 }
  validates :connected, inclusion: { in: [true, false] }, allow_nil: true
  validates :auto_sync, inclusion: { in: [true, false] }, allow_nil: true
end
