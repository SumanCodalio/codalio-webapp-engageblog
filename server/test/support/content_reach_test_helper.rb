# frozen_string_literal: true

# Shared test scaffolding for the ContentReach backend.
#
# Builds the multi-tenant contract (organizations, roles, memberships, the
# org-role permission layer) plus the demo personas, mirroring db/seeds.rb so
# request specs exercise the same authorization chain the runtime uses.
module ContentReachTestHelper
  ROLE_SLUGS = %w[admin content_manager editor contributor].freeze

  POST_FULL = %w[posts.index posts.show posts.store posts.update posts.destroy posts.trashed posts.restore].freeze
  POST_EDIT = %w[posts.index posts.show posts.store posts.update].freeze
  POST_READ = %w[posts.index posts.show].freeze
  VIDEO_FULL = %w[videos.index videos.show videos.store videos.update videos.destroy videos.trashed videos.restore].freeze
  VIDEO_EDIT = %w[videos.index videos.show videos.store videos.update].freeze
  VIDEO_READ = %w[videos.index videos.show].freeze
  ANALYTICS_FULL = %w[analytics_data.index analytics_data.show analytics_data.store analytics_data.update analytics_data.destroy].freeze
  ANALYTICS_WRITE = %w[analytics_data.index analytics_data.show analytics_data.store].freeze
  ANALYTICS_READ = %w[analytics_data.index analytics_data.show].freeze
  USER_READ = %w[users.index users.show roles.index roles.show].freeze
  ORG_READ = %w[organizations.index organizations.show].freeze
  ADMIN_ONLY = %w[
    integrations.index integrations.show integrations.store integrations.update integrations.destroy
    api_tokens.index api_tokens.show api_tokens.store api_tokens.update api_tokens.destroy
    webhooks.index webhooks.show webhooks.store webhooks.update webhooks.destroy
    system_settings.index system_settings.show system_settings.store system_settings.update
    system_reports.index system_reports.show system_reports.store system_reports.update system_reports.destroy
    role_permissions.index role_permissions.show role_permissions.store role_permissions.update role_permissions.destroy
    users.index users.show users.store users.update users.destroy
    roles.index roles.show
  ].freeze

  def permission_matrix
    {
      "admin" => (POST_FULL + VIDEO_FULL + ANALYTICS_FULL + ADMIN_ONLY + ORG_READ).uniq,
      "content_manager" => (POST_FULL + VIDEO_FULL + ANALYTICS_WRITE + USER_READ + ORG_READ).uniq,
      "editor" => (POST_EDIT + VIDEO_EDIT + ANALYTICS_WRITE + USER_READ + ORG_READ).uniq,
      "contributor" => (POST_READ + VIDEO_READ + ANALYTICS_READ + USER_READ + ORG_READ).uniq
    }
  end

  def build_roles
    ROLE_SLUGS.each_with_object({}) do |slug, memo|
      memo[slug] = Role.find_or_create_by!(slug: slug) do |role|
        role.name = slug.titleize
      end
    end
  end

  def build_organization(slug:, name: nil)
    Organization.find_or_create_by!(slug: slug) { |org| org.name = name || slug.titleize }
  end

  def grant_permissions(organization, roles)
    permission_matrix.each do |role_slug, permissions|
      record = OrgRolePermission.find_or_initialize_by(organization: organization, role: roles[role_slug])
      record.permissions = permissions
      record.save!
    end
  end

  def build_user(email:, name: nil, password: "password")
    user = User.find_or_initialize_by(email: email)
    user.name = name || email.split("@").first.titleize
    # Mirror db/seeds.rb: the profile-field extension (AC-71) is populated for
    # every seeded identity, so specs can assert the admin table's columns.
    user.first_name ||= user.name.split(" ").first
    user.last_name ||= user.name.split(" ").last
    user.approved = true if user.approved.nil?
    user.profile_completed = true if user.profile_completed.nil?
    user.password = password if user.new_record? || user.password_digest.blank?
    user.save!
    user
  end

  def build_membership(user:, organization:, role:)
    UserRole.find_or_create_by!(user: user, organization: organization, role: role)
  end

  # Builds the full contract and returns a hash of the seeded identities.
  def seed_contract
    roles = build_roles
    demo_org = build_organization(slug: "demo-org", name: "ContentReach Media Inc.")
    other_org = build_organization(slug: "runtime-other-org", name: "Runtime Other Organization")
    [demo_org, other_org].each { |org| grant_permissions(org, roles) }

    admin = build_user(email: "administrator@example.com", name: "Administrator")
    build_membership(user: admin, organization: demo_org, role: roles["admin"])

    viewer = build_user(email: "viewer@example.com", name: "Viewer")
    build_membership(user: viewer, organization: demo_org, role: roles["contributor"])

    outsider = build_user(email: "outsider@example.com", name: "Outsider")
    build_membership(user: outsider, organization: other_org, role: roles["admin"])

    manager = build_user(email: "sarah.chen@contentreach.io", name: "Sarah Chen")
    build_membership(user: manager, organization: demo_org, role: roles["content_manager"])

    editor = build_user(email: "david.kim@contentreach.io", name: "David Kim")
    build_membership(user: editor, organization: demo_org, role: roles["editor"])

    {
      roles: roles,
      demo_org: demo_org,
      other_org: other_org,
      admin: admin,
      viewer: viewer,
      outsider: outsider,
      manager: manager,
      editor: editor
    }
  end

  def auth_headers(user)
    { "Authorization" => "Bearer #{user.api_token}" }
  end

  def build_post(organization:, user:, title: "Representative Post", status: "published", **attrs)
    Post.unscoped.find_or_create_by!(organization_id: organization.id, title: title) do |post|
      post.user = user
      post.status = status
      post.content = "Body for #{title}"
      post.category = attrs[:category] || "Engineering"
      post.view_count = attrs[:view_count] || 0
      post.published_at = attrs[:published_at]
      post.read_time_minutes = attrs[:read_time_minutes] || 5
    end
  end
end
