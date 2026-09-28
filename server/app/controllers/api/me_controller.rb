# frozen_string_literal: true

module Api
  # Returns the authenticated user together with their roles in the resolved
  # organization.
  #
  #   GET /api/{organization}/me
  #
  # The rhino-react `useUserRole` hook resolves roles through a Laravel-shaped
  # `organizations?include=users` payload (`users[].pivot.role_id`) that the
  # Rails backend does not serve, and the login response carries no user. This
  # endpoint is the host-owned source of truth the client's `useUserRole` shim
  # reads for sidebar/nav role gating.
  class MeController < BaseController
    def show
      return if performed?

      user = current_user
      organization = current_organization

      roles = if user && organization
                user.user_roles.where(organization_id: organization.id).includes(:role).map(&:role).compact
              else
                []
              end

      render json: {
        id: user.id,
        email: user.email,
        name: user.respond_to?(:full_name) ? user.full_name : user.name,
        first_name: user.try(:first_name),
        last_name: user.try(:last_name),
        approved: user.try(:approved),
        organization: organization && { id: organization.id, slug: organization.slug, name: organization.name },
        roles: roles.map { |role| { id: role.id, name: role.name, slug: role.slug } }
      }
    end
  end
end
