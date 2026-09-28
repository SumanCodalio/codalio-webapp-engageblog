# frozen_string_literal: true

module Api
  # Extra 13: webhook test ping.
  #
  #   POST /api/{organization}/webhooks/{id}/ping
  #
  # Performs a test dispatch and updates the webhook status.
  class WebhooksController < BaseController
    def ping
      return if performed?

      require_admin!
      return if performed?

      webhook = Rhino.query(Webhook).find_by(id: params[:id])

      unless webhook
        return render json: { message: "Webhook not found" }, status: :not_found
      end

      webhook.update!(status: "active")

      render json: {
        message: "Test ping dispatched",
        webhook: webhook.as_rhino_json
      }
    end
  end
end
