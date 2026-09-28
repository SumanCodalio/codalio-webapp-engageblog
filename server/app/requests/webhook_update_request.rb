# frozen_string_literal: true

# Validation for PUT /{resource}/:id on Webhook.
class WebhookUpdateRequest < Rhino::ResourceRequest
  attribute :url, :string
  attribute :events
  attribute :status, :string

  validates :url, presence: true, if: -> { input.key?("url") }
  validates :url, length: { maximum: 255 }, allow_nil: true
end
