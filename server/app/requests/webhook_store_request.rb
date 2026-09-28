# frozen_string_literal: true

# Validation for POST /{resource} on Webhook. `url` is required.
class WebhookStoreRequest < Rhino::ResourceRequest
  attribute :url, :string
  attribute :events
  attribute :status, :string

  validates :url, presence: true, length: { maximum: 255 }
end
