# frozen_string_literal: true


org = Organization.find_or_create_by!(slug: 'demo-org') do |o|
  o.name = 'Demo Organization'
end

# Admin
admin_user = User.find_or_create_by!(email: 'admin@demo.com') do |u|
  u.password = 'password'
end
admin_role = Role.find_by!(slug: 'admin')
UserRole.find_or_create_by!(
  user: admin_user,
  organization: org,
  role: admin_role
) do |ur|
  ur.permissions = [
        'analytics_data.destroy',
        'analytics_data.index',
        'analytics_data.show',
        'analytics_data.store',
        'analytics_data.update',
        'api_tokens.destroy',
        'api_tokens.index',
        'api_tokens.show',
        'api_tokens.store',
        'api_tokens.update',
        'integrations.destroy',
        'integrations.index',
        'integrations.show',
        'integrations.store',
        'integrations.update',
        'role_permissions.destroy',
        'role_permissions.index',
        'role_permissions.show',
        'role_permissions.store',
        'role_permissions.update',
        'system_reports.destroy',
        'system_reports.index',
        'system_reports.show',
        'system_reports.store',
        'system_reports.update',
        'system_settings.index',
        'system_settings.show',
        'system_settings.store',
        'system_settings.update',
        'webhooks.destroy',
        'webhooks.index',
        'webhooks.show',
        'webhooks.store',
        'webhooks.update',
      ]
end

# Content Manager
content_manager_user = User.find_or_create_by!(email: 'content_manager@demo.com') do |u|
  u.password = 'password'
end
content_manager_role = Role.find_by!(slug: 'content_manager')
UserRole.find_or_create_by!(
  user: content_manager_user,
  organization: org,
  role: content_manager_role
) do |ur|
  ur.permissions = [
        'analytics_data.index',
        'analytics_data.show',
        'analytics_data.store',
        'integrations.index',
        'integrations.show',
        'role_permissions.index',
        'role_permissions.show',
      ]
end

# Editor
editor_user = User.find_or_create_by!(email: 'editor@demo.com') do |u|
  u.password = 'password'
end
editor_role = Role.find_by!(slug: 'editor')
UserRole.find_or_create_by!(
  user: editor_user,
  organization: org,
  role: editor_role
) do |ur|
  ur.permissions = [
        'analytics_data.index',
        'analytics_data.show',
        'analytics_data.store',
        'integrations.index',
        'integrations.show',
        'role_permissions.index',
        'role_permissions.show',
      ]
end

# Contributor
contributor_user = User.find_or_create_by!(email: 'contributor@demo.com') do |u|
  u.password = 'password'
end
contributor_role = Role.find_by!(slug: 'contributor')
UserRole.find_or_create_by!(
  user: contributor_user,
  organization: org,
  role: contributor_role
) do |ur|
  ur.permissions = ['analytics_data.index', 'analytics_data.show']
end
