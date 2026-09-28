# frozen_string_literal: true

# Workaround for a rhino-rails 4.10.0 limitation in
# Rhino::ResourcesController#params_hash.
#
# The engine builds the write payload with
#   params.except(:controller, :action, :model_slug, :route_group,
#                 :organization, :id, :format, :scope).to_unsafe_h
# `:format` is excluded because Rails reserves it for the response format
# (`.json`). But `format` is also a legitimate model column on Video (the
# media-library asset format: mp4/mov/avi), so every client-submitted `format`
# value is silently dropped on create/update — the UI's "Start Transcode"
# dialog and the asset inspector both send it.
#
# This reopens the controller so `format` is only stripped when the resolved
# model has no `format` column. For models that do (Video), the submitted value
# flows through the normal policy + request-class validation path.
Rails.application.config.to_prepare do
  Rhino::ResourcesController.class_eval do
    private

    def params_hash
      reserved = %i[controller action model_slug route_group organization id scope format]
      data = params.except(*reserved).to_unsafe_h

      # Rails injects its own `format` param ("json") from the request
      # negotiation, which would clobber a body-supplied `format` value. When
      # the model actually has a `format` column, take the value from the
      # parsed request body instead.
      if model_has_format_column?
        body_format = request.request_parameters["format"]
        data["format"] = body_format unless body_format.nil?
      end

      data
    end

    def model_has_format_column?
      klass = model_class
      klass.respond_to?(:column_names) && klass.column_names.include?("format")
    rescue StandardError
      false
    end
  end
end
