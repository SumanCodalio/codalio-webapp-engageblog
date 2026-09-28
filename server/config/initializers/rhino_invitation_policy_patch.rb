# frozen_string_literal: true

# Workaround for a rhino-rails 4.10.0 bug in Rhino::InvitationPolicy.
#
# Rhino::InvitationsController#create authorizes with
#   authorize OrganizationInvitation, :create?, policy_class: InvitationPolicy
# which hands the policy the CLASS, not an instance. The stock
# `user_belongs_to_organization?` then calls `invitation.respond_to?(:organization_id)`
# on the class (false — it is an instance method) and denies every invitation
# with a 403, so an admin can never invite a member.
#
# This reopens the policy so the class case resolves the organization from the
# request context instead. Instance-level behavior is unchanged.
Rails.application.config.to_prepare do
  Rhino::InvitationPolicy.class_eval do
    # AC-29 / AC-65: invitation management backs the admin-only /admin/users
    # surface, so every action additionally requires the `admin` role in the
    # request's organization. Without this a content_manager (who legitimately
    # belongs to the org) could invite members.
    def index?
      user_belongs_to_organization? && admin?
    end

    def create?
      user_belongs_to_organization? && admin? && role_allowed?
    end

    def update?
      user_belongs_to_organization? && admin? && invitation.pending?
    end

    def destroy?
      user_belongs_to_organization? && admin? && invitation.pending?
    end

    private

    def admin?
      return false unless user

      org =
        if invitation.respond_to?(:organization)
          invitation.organization
        elsif defined?(RequestStore)
          RequestStore.store[:rhino_organization]
        end

      user.respond_to?(:role_slug_for_validation) &&
        user.role_slug_for_validation(org) == "admin"
    end

    def user_belongs_to_organization?
      return false unless user

      org_id =
        if invitation.respond_to?(:organization_id)
          invitation.organization_id
        elsif defined?(RequestStore)
          RequestStore.store[:rhino_organization]&.id
        end
      return false unless org_id

      if user.respond_to?(:user_roles)
        user.user_roles.exists?(organization_id: org_id)
      else
        true
      end
    end
  end

  # Second rhino-rails 4.10.0 bug: OrganizationInvitation validates `token`
  # presence but generates it in `before_create`, which runs AFTER validation —
  # so every invitation fails with "Token can't be blank". Generate the token
  # before validation instead.
  Rhino::OrganizationInvitation.class_eval do
    before_validation :generate_token, on: :create
    before_validation :set_expiration, on: :create
  end

  # Third rhino-rails 4.10.0 gap: InvitationsController includes
  # Pundit::Authorization but never rescues Pundit::NotAuthorizedError, so a
  # denied invitation action escapes as a 500 instead of the 403 the API
  # contract (and the client's error handling) expects.
  Rhino::InvitationsController.class_eval do
    rescue_from Pundit::NotAuthorizedError do |_e|
      render json: { message: "This action is unauthorized." }, status: :forbidden
    end
  end
end
