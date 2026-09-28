# frozen_string_literal: true


Role.find_or_create_by!(slug: 'admin') do |r|
  r.name = 'Admin'
  r.description = 'Privileged administrator. Full access to all features and data, including the /admin route group (users, integrations, system settings, reports).'
end

Role.find_or_create_by!(slug: 'content_manager') do |r|
  r.name = 'Content Manager'
  r.description = 'Content team lead. Creates, edits, publishes and deletes posts and media; views analytics. Canonical id for the PRD\'s \'content_team_member\'.'
end

Role.find_or_create_by!(slug: 'editor') do |r|
  r.name = 'Editor'
  r.description = 'Content team member. Creates and edits posts and media, views analytics. Cannot delete or manage privileged capabilities (4K upload, API keys, security config).'
end

Role.find_or_create_by!(slug: 'contributor') do |r|
  r.name = 'Contributor'
  r.description = 'Read-only content team member. Can view posts and media but cannot create, edit or delete (draft-only tier).'
end
