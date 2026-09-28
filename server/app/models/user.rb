# frozen_string_literal: true

class User < ApplicationRecord
  include Rhino::HasPermissions
  include Rhino::HidableColumns
  include Rhino::HasValidation

  has_secure_password
  has_secure_token :api_token

  has_many :user_roles, dependent: :destroy
  has_many :organizations, through: :user_roles
  has_many :roles, through: :user_roles
  has_many :posts, dependent: :nullify
  has_many :videos, dependent: :nullify

  rhino_additional_hidden :api_token, :reset_password_token, :reset_password_sent_at

  # AC-28: tenant-scope the member directory.
  #
  # User has no `organization_id` column and no `belongs_to :organization`
  # (membership lives on the `user_roles` join), so Rhino's automatic
  # organization scoping cannot discover a path and `GET /api/{org}/users`
  # would otherwise return every tenant's users. Rhino's scoping chain checks
  # `for_organization` before the column/relationship fallbacks, so defining it
  # here narrows both the index and member lookups to the request organization's
  # members. It is a plain class method (not a default_scope), so direct lookups
  # such as `User.find_by(api_token:)` during authentication are unaffected.
  def self.for_organization(organization)
    return none unless organization

    # A subquery (rather than `joins(...).distinct`) avoids Postgres' "could not
    # identify an equality operator for type json" on the users table's json
    # columns while still returning each member exactly once.
    where(id: UserRole.where(organization_id: organization.id).select(:user_id))
  end

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  # Virtual attribute backing the admin "change role" action
  # (`useModelUpdate('users')` with `{ role_id }`). The users table has no
  # role_id column — the role lives on the user_roles membership — so this
  # writer syncs the membership for the request's organization.
  attr_accessor :role_id

  after_save :sync_role_membership, if: -> { @role_id_supplied }

  def role_id=(value)
    @role_id_supplied = value.present?
    @role_id = value
  end

  def role_id
    @role_id
  end

  # Full display name, falling back to the single `name` column.
  def full_name
    [first_name, last_name].compact_blank.join(" ").presence || name
  end

  # The user's role in the request's organization, exposed on the users index so
  # the admin Team & Roles table can render each member's role from server state
  # (the `user_roles` join table is not itself a registered Rhino resource).
  def role_name
    membership = current_membership
    membership&.role&.name
  end

  def role_slug
    membership = current_membership
    membership&.role&.slug
  end

  def rhino_computed_attributes
    { "full_name" => full_name, "role_name" => role_name, "role_slug" => role_slug }
  end

  private

  def current_membership
    return nil unless defined?(RequestStore)

    organization = RequestStore.store[:rhino_organization]
    return nil unless organization

    user_roles.includes(:role).find_by(organization_id: organization.id)
  end

  def sync_role_membership
    return unless defined?(RequestStore)

    organization = RequestStore.store[:rhino_organization]
    return unless organization

    membership = user_roles.find_by(organization_id: organization.id)
    return unless membership

    membership.update!(role_id: @role_id)
  end
end
