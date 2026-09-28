# frozen_string_literal: true

module Api
  # Base controller for Rhino custom (non-CRUD) endpoints.
  #
  # Resolves the tenant organization from the :organization route param and the
  # authenticated user from the Bearer api_token, mirroring the engine's
  # ResourcesController. Subclasses must call `authorize_permission!` (or a
  # policy gate) before touching data.
  class BaseController < ActionController::API
    include Pundit::Authorization

    before_action :resolve_organization
    before_action :authenticate_user!

    rescue_from Pundit::NotAuthorizedError do |_e|
      render json: { message: "This action is unauthorized." }, status: :forbidden
    end

    private

    def resolve_organization
      org_identifier = params[:organization]
      return if org_identifier.blank?

      org_class = "Organization".safe_constantize
      return unless org_class

      column = Rhino.config.multi_tenant[:organization_identifier_column] || "id"
      organization = org_class.find_by(column => org_identifier)

      unless organization
        render json: { message: "Organization not found" }, status: :not_found
        return
      end

      user = current_user
      if user && user.respond_to?(:user_roles) && !user.user_roles.exists?(organization_id: organization.id)
        render json: { message: "Organization not found" }, status: :not_found
        return
      end

      request.env["rhino.organization"] = organization
      RequestStore.store[:rhino_organization] = organization if defined?(RequestStore)
    end

    def authenticate_user!
      return if current_user

      render json: { message: "Unauthenticated." }, status: :unauthorized
    end

    def current_user
      @current_user ||= begin
        token = request.headers["Authorization"]&.sub(/\ABearer /, "")
        return nil unless token

        user_class = "User".safe_constantize
        return nil unless user_class

        user = if user_class.respond_to?(:find_by_api_token)
                 user_class.find_by_api_token(token)
               elsif user_class.column_names.include?("api_token")
                 user_class.find_by(api_token: token)
               end

        RequestStore.store[:rhino_current_user] = user if defined?(RequestStore) && user
        user
      end
    end

    def current_organization
      request.env["rhino.organization"]
    end

    # Gate an action on a `{slug}.{action}` permission for the current org.
    def authorize_permission!(slug, action)
      return if current_user&.has_permission?("#{slug}.#{action}", current_organization)

      render json: { message: "This action is unauthorized." }, status: :forbidden
    end

    def require_admin!
      return if current_user&.role_slug_for_validation(current_organization) == "admin"

      render json: { message: "This action is unauthorized." }, status: :forbidden
    end
  end
end
