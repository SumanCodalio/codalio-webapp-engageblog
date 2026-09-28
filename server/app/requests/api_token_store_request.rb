# frozen_string_literal: true

# Validation for POST /{resource} on ApiToken. `name` and `token_prefix` are required.
class ApiTokenStoreRequest < Rhino::ResourceRequest
  attribute :name, :string
  attribute :token_prefix, :string
  attribute :last_used_at, :datetime

  validates :name, presence: true, length: { maximum: 255 }
  validates :token_prefix, presence: true, length: { maximum: 255 }
end
