# frozen_string_literal: true

# Idempotent development seeds.
#
# Covers the host-runtime contract (administrator / viewer / outsider) plus the
# ContentReach demo personas (Alex Thorne = admin, Sarah Chen = content_manager,
# an editor and a contributor) and representative tenant records.

# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------
ROLE_DEFINITIONS = {
  "admin" => {
    name: "Admin",
    description: "Privileged administrator. Full access to all features and data."
  },
  "content_manager" => {
    name: "Content Manager",
    description: "Content team lead. Creates, edits, publishes and deletes posts and media."
  },
  "editor" => {
    name: "Editor",
    description: "Content team member. Creates and edits posts and media."
  },
  "contributor" => {
    name: "Contributor",
    description: "Read-only content team member. Can view posts and media but cannot create, edit or delete."
  }
}.freeze

roles = ROLE_DEFINITIONS.each_with_object({}) do |(slug, attrs), memo|
  role = Role.find_or_initialize_by(slug: slug)
  role.name = attrs[:name]
  role.description = attrs[:description]
  role.save!
  memo[slug] = role
end

# ---------------------------------------------------------------------------
# Permission matrix (the shared role layer, per organization)
# ---------------------------------------------------------------------------
POST_FULL = %w[posts.index posts.show posts.store posts.update posts.destroy posts.trashed posts.restore].freeze
POST_EDIT = %w[posts.index posts.show posts.store posts.update].freeze
POST_READ = %w[posts.index posts.show].freeze

VIDEO_FULL = %w[videos.index videos.show videos.store videos.update videos.destroy videos.trashed videos.restore].freeze
VIDEO_EDIT = %w[videos.index videos.show videos.store videos.update].freeze
VIDEO_READ = %w[videos.index videos.show].freeze

ANALYTICS_FULL = %w[analytics_data.index analytics_data.show analytics_data.store analytics_data.update analytics_data.destroy].freeze
ANALYTICS_WRITE = %w[analytics_data.index analytics_data.show analytics_data.store].freeze
ANALYTICS_READ = %w[analytics_data.index analytics_data.show].freeze

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

# Every authenticated role may read the member directory (needed for `?include=user`
# on posts/videos and for the admin user list); only admin may write it.
USER_READ = %w[users.index users.show roles.index roles.show].freeze

# The rhino-react `useUserRole`/`useOwner` hooks read the current organization
# with `?include=users` to resolve the signed-in user's roles. Every role needs
# read access to its own organization for the sidebar/nav gating to work.
ORG_READ = %w[organizations.index organizations.show].freeze

PERMISSION_MATRIX = {
  "admin" => (POST_FULL + VIDEO_FULL + ANALYTICS_FULL + ADMIN_ONLY + ORG_READ).uniq,
  "content_manager" => (POST_FULL + VIDEO_FULL + ANALYTICS_WRITE + USER_READ + ORG_READ).uniq,
  "editor" => (POST_EDIT + VIDEO_EDIT + ANALYTICS_WRITE + USER_READ + ORG_READ).uniq,
  "contributor" => (POST_READ + VIDEO_READ + ANALYTICS_READ + USER_READ + ORG_READ).uniq
}.freeze

# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------
demo_org = Organization.find_or_initialize_by(slug: "demo-org")
demo_org.name = "ContentReach Media Inc."
demo_org.description = "Demo organization for ContentReach."
demo_org.save!

other_org = Organization.find_or_initialize_by(slug: "runtime-other-org")
other_org.name = "Runtime Other Organization"
other_org.description = "Second organization used by the host runtime contract."
other_org.save!

[demo_org, other_org].each do |org|
  PERMISSION_MATRIX.each do |role_slug, permissions|
    record = OrgRolePermission.find_or_initialize_by(organization: org, role: roles[role_slug])
    record.permissions = permissions
    record.save!
  end
end

# ---------------------------------------------------------------------------
# Users + memberships
# ---------------------------------------------------------------------------
def seed_user(email:, name:, first_name:, last_name:, approved: true, profile_completed: true)
  user = User.find_or_initialize_by(email: email)
  user.name = name
  user.first_name = first_name
  user.last_name = last_name
  user.approved = approved
  user.profile_completed = profile_completed
  user.password = "password" if user.new_record? || user.password_digest.blank?
  user.save!
  user
end

def seed_membership(user:, organization:, role:)
  membership = UserRole.find_or_initialize_by(user: user, organization: organization, role: role)
  membership.permissions = []
  membership.granted_permissions = []
  membership.denied_permissions = []
  membership.save!
  membership
end

# Host-runtime contract identities
administrator = seed_user(email: "administrator@example.com", name: "Administrator",
                          first_name: "Ada", last_name: "Administrator")
seed_membership(user: administrator, organization: demo_org, role: roles["admin"])

viewer = seed_user(email: "viewer@example.com", name: "Viewer",
                   first_name: "Vera", last_name: "Viewer")
seed_membership(user: viewer, organization: demo_org, role: roles["contributor"])

outsider = seed_user(email: "outsider@example.com", name: "Outsider",
                     first_name: "Oscar", last_name: "Outsider")
seed_membership(user: outsider, organization: other_org, role: roles["admin"])

# ContentReach demo personas
alex = seed_user(email: "alex.thorne@contentreach.io", name: "Alex Thorne",
                 first_name: "Alex", last_name: "Thorne")
seed_membership(user: alex, organization: demo_org, role: roles["admin"])

sarah = seed_user(email: "sarah.chen@contentreach.io", name: "Sarah Chen",
                  first_name: "Sarah", last_name: "Chen")
seed_membership(user: sarah, organization: demo_org, role: roles["content_manager"])

david = seed_user(email: "david.kim@contentreach.io", name: "David Kim",
                  first_name: "David", last_name: "Kim")
seed_membership(user: david, organization: demo_org, role: roles["editor"])

priya = seed_user(email: "priya.nair@contentreach.io", name: "Priya Nair",
                  first_name: "Priya", last_name: "Nair")
seed_membership(user: priya, organization: demo_org, role: roles["contributor"])

# ---------------------------------------------------------------------------
# Representative tenant records
# ---------------------------------------------------------------------------
def seed_post(organization:, user:, title:, category:, status:, view_count:, published_at: nil,
              read_time_minutes: 5, content: nil)
  post = Post.unscoped.find_or_initialize_by(organization_id: organization.id, title: title)
  post.user = user
  post.category = category
  post.status = status
  post.view_count = view_count
  post.read_time_minutes = read_time_minutes
  post.content = content || "#{title}\n\nA representative ContentReach article."
  post.published_at = published_at
  post.save!
  post
end

demo_post = seed_post(
  organization: demo_org, user: sarah,
  title: "How We Scaled Next-Gen Serverless Video Transcoding to 50k Concurrent Streams",
  category: "Engineering", status: "published", view_count: 48_290,
  published_at: 3.days.ago, read_time_minutes: 6
)

seed_post(
  organization: demo_org, user: sarah,
  title: "10 Proven Strategies to Turn Organic Blog Readers into Video Subscribers",
  category: "Growth & SEO", status: "draft", view_count: 0, read_time_minutes: 8
)

seed_post(
  organization: demo_org, user: david,
  title: "Architecting Distributed Video Blogs for High-Retention Readership",
  category: "Engineering", status: "published", view_count: 12_400,
  published_at: 10.days.ago, read_time_minutes: 9
)

other_post = seed_post(
  organization: other_org, user: outsider,
  title: "Runtime Other Org Representative Post",
  category: "General", status: "published", view_count: 5,
  published_at: 1.day.ago, read_time_minutes: 3
)

def seed_video(organization:, user:, title:, post: nil, duration_seconds: 300, media_type: "video")
  video = Video.unscoped.find_or_initialize_by(organization_id: organization.id, title: title)
  video.user = user
  video.post = post
  video.url = "https://cdn.contentreach.io/hls/v1/#{title.parameterize}/master.m3u8"
  video.media_type = media_type
  video.format = "mp4"
  video.file_size = "184.2 MB"
  video.resolution = "4K UHD (3840x2160)"
  video.bitrate = "12.4 Mbps"
  video.duration_seconds = duration_seconds
  video.status = "ready"
  video.save!
  video
end

seed_video(organization: demo_org, user: sarah, title: "Keynote 2025 Architecture Walkthrough",
           post: demo_post, duration_seconds: 760)
seed_video(organization: demo_org, user: david, title: "Serverless Transcoding Architecture Diagram",
           post: nil, duration_seconds: 0, media_type: "image")
seed_video(organization: other_org, user: outsider, title: "Other Org Sample Video",
           post: other_post, duration_seconds: 120)

def seed_analytics(organization:, post:, event_type:, visitor_id:, recorded_at:)
  record = AnalyticsData.unscoped.find_or_initialize_by(
    organization_id: organization.id, post_id: post.id,
    event_type: event_type, visitor_id: visitor_id, recorded_at: recorded_at
  )
  record.event_data = { "source" => "seed" }
  record.save!
  record
end

seed_analytics(organization: demo_org, post: demo_post, event_type: "view",
               visitor_id: "visitor-1", recorded_at: 2.days.ago)
seed_analytics(organization: demo_org, post: demo_post, event_type: "view",
               visitor_id: "visitor-2", recorded_at: 1.day.ago)
seed_analytics(organization: demo_org, post: demo_post, event_type: "share",
               visitor_id: "visitor-1", recorded_at: 1.day.ago)
seed_analytics(organization: other_org, post: other_post, event_type: "view",
               visitor_id: "other-visitor", recorded_at: 1.day.ago)

# ---------------------------------------------------------------------------
# Admin module records
# ---------------------------------------------------------------------------
def seed_integration(organization:, name:, category:, connected:, description:)
  record = Integration.unscoped.find_or_initialize_by(organization_id: organization.id, name: name)
  record.category = category
  record.connected = connected
  record.description = description
  record.auto_sync = true
  record.save!
  record
end

seed_integration(organization: demo_org, name: "YouTube Data API v3", category: "Video Hosting",
                 connected: true, description: "Auto-publish video blogs directly to YouTube channels.")
seed_integration(organization: demo_org, name: "Google Analytics 4", category: "Analytics",
                 connected: true, description: "Stream custom reach and video watch depth events.")
seed_integration(organization: demo_org, name: "HubSpot CRM", category: "Marketing Automation",
                 connected: false, description: "Sync leads and campaign attribution.")

def seed_system_setting(organization:)
  record = SystemSetting.unscoped.find_or_initialize_by(organization_id: organization.id)
  record.company_name = organization.name
  record.custom_domain = "blog.contentreach.io"
  record.contact_email = "editor@contentreach.io"
  record.transcode_preset = "1080p"
  record.max_upload_size = "1024mb"
  record.auto_captions = true
  record.auto_chapters = true
  record.enforce_2fa = true
  record.session_timeout_minutes = 60
  record.sso_provider = "okta"
  record.save!
  record
end

seed_system_setting(organization: demo_org)
seed_system_setting(organization: other_org)

def seed_api_token(organization:, name:, token_prefix:)
  record = ApiToken.unscoped.find_or_initialize_by(organization_id: organization.id, name: name)
  record.token_prefix = token_prefix
  record.last_used_at = 2.hours.ago
  record.save!
  record
end

seed_api_token(organization: demo_org, name: "Production Publishing Key", token_prefix: "cr_live_9f2a")
seed_api_token(organization: demo_org, name: "Analytics Read Key", token_prefix: "cr_read_4b71")

def seed_webhook(organization:, url:, events:, status:)
  record = Webhook.unscoped.find_or_initialize_by(organization_id: organization.id, url: url)
  record.events = events
  record.status = status
  record.save!
  record
end

seed_webhook(organization: demo_org, url: "https://hooks.contentreach.io/publish",
             events: %w[post.published video.uploaded], status: "active")
seed_webhook(organization: demo_org, url: "https://hooks.contentreach.io/analytics",
             events: %w[analytics.threshold], status: "pending")

def seed_role_permission(organization:, capability:, role_key:, enabled:, description: nil)
  record = RolePermission.unscoped.find_or_initialize_by(
    organization_id: organization.id, capability: capability, role_key: role_key
  )
  record.description = description
  record.enabled = enabled
  record.save!
  record
end

seed_role_permission(organization: demo_org, capability: "Publish Posts", role_key: "content_manager",
                     enabled: true, description: "Publish and schedule posts.")
seed_role_permission(organization: demo_org, capability: "Delete Posts", role_key: "editor",
                     enabled: false, description: "Permanently delete posts.")
seed_role_permission(organization: demo_org, capability: "Manage API Keys", role_key: "admin",
                     enabled: true, description: "Create and revoke API tokens.")

def seed_system_report(organization:, report_type:, status:, summary:)
  record = SystemReport.unscoped.find_or_initialize_by(
    organization_id: organization.id, report_type: report_type
  )
  record.status = status
  record.generated_at = Time.current
  record.summary = summary
  record.save!
  record
end

seed_system_report(organization: demo_org, report_type: "performance", status: "ready",
                   summary: { "uptime" => "99.98%", "avg_response_ms" => 142 })
seed_system_report(organization: demo_org, report_type: "security_audit", status: "ready",
                   summary: { "blocked_attempts" => 12 })
seed_system_report(organization: demo_org, report_type: "backup", status: "ready",
                   summary: { "posts" => 3, "videos" => 2, "analytics_events" => 3 })

puts "Seeded #{Organization.count} organizations, #{User.count} users, #{Post.unscoped.count} posts."
