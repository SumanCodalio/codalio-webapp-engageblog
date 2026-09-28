# frozen_string_literal: true

# Assigns the authenticated user as the record's author on create when the
# client did not supply one.
#
# `user_id` is a required column on Post and Video, but it is not a
# policy-permitted create field (the client must not be able to forge an
# author). This mirrors `Rhino::BelongsToOrganization`'s organization_id
# handling: the framework fills the FK from the request context.
module AssignsCurrentUser
  extend ActiveSupport::Concern

  included do
    before_validation :assign_current_user, on: :create
  end

  private

  def assign_current_user
    return if user_id.present?
    return unless defined?(RequestStore)

    current = RequestStore.store[:rhino_current_user]
    self.user_id = current.id if current
  end
end
