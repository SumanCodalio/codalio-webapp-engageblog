# frozen_string_literal: true

# Validation for PUT /{resource}/:id on Integration.
class IntegrationUpdateRequest < Rhino::ResourceRequest
  attribute :name, :string
  attribute :category, :string
  attribute :description, :string
  attribute :connected, :boolean
  attribute :client_id, :string
  attribute :api_key, :string
  attribute :auto_sync, :boolean

  validates :name, presence: true, if: -> { input.key?("name") }
  validates :name, length: { maximum: 255 }, allow_nil: true
  validates :connected, inclusion: { in: [true, false] }, allow_nil: true
  validates :auto_sync, inclusion: { in: [true, false] }, allow_nil: true
end
