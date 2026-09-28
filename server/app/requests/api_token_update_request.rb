# frozen_string_literal: true

# Validation for PUT /{resource}/:id on ApiToken.
class ApiTokenUpdateRequest < Rhino::ResourceRequest
  attribute :name, :string
  attribute :token_prefix, :string
  attribute :last_used_at, :datetime

  validates :name, presence: true, if: -> { input.key?("name") }
  validates :name, length: { maximum: 255 }, allow_nil: true
  validates :token_prefix, presence: true, if: -> { input.key?("token_prefix") }
  validates :token_prefix, length: { maximum: 255 }, allow_nil: true
end
