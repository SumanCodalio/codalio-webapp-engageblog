# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_28_165955) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "analytics_data", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "post_id"
    t.string "event_type"
    t.string "visitor_id"
    t.json "event_data"
    t.datetime "recorded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_analytics_data_on_organization_id"
    t.index ["post_id"], name: "index_analytics_data_on_post_id"
  end

  create_table "api_tokens", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name"
    t.string "token_prefix"
    t.datetime "last_used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_api_tokens_on_organization_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "auditable_type", null: false
    t.bigint "auditable_id", null: false
    t.string "action", null: false
    t.json "old_values"
    t.json "new_values"
    t.bigint "user_id"
    t.string "user_type"
    t.string "ip_address"
    t.string "user_agent"
    t.bigint "organization_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable_type_and_auditable_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["organization_id"], name: "index_audit_logs_on_organization_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "integrations", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name"
    t.string "category"
    t.text "description"
    t.boolean "connected"
    t.string "client_id"
    t.string "api_key"
    t.boolean "auto_sync", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_integrations_on_organization_id"
  end

  create_table "org_role_permissions", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "role_id", null: false
    t.json "permissions", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "role_id"], name: "index_org_role_permissions_on_org_role", unique: true
    t.index ["organization_id"], name: "index_org_role_permissions_on_organization_id"
    t.index ["role_id"], name: "index_org_role_permissions_on_role_id"
  end

  create_table "organization_invitations", force: :cascade do |t|
    t.bigint "organization_id"
    t.bigint "role_id"
    t.bigint "invited_by"
    t.string "email", null: false
    t.string "token", null: false
    t.string "status", default: "pending", null: false
    t.string "route_group"
    t.datetime "expires_at"
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_organization_invitations_on_email"
    t.index ["organization_id"], name: "index_organization_invitations_on_organization_id"
    t.index ["role_id"], name: "index_organization_invitations_on_role_id"
    t.index ["status"], name: "index_organization_invitations_on_status"
    t.index ["token"], name: "index_organization_invitations_on_token", unique: true
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.string "slug"
    t.text "content"
    t.string "category"
    t.json "tags"
    t.string "status", default: "draft", null: false
    t.integer "read_time_minutes"
    t.integer "view_count", default: 0, null: false
    t.datetime "published_at"
    t.datetime "scheduled_at"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_posts_on_discarded_at"
    t.index ["organization_id"], name: "index_posts_on_organization_id"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "role_permissions", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "capability"
    t.text "description"
    t.string "role_key"
    t.boolean "enabled"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_role_permissions_on_organization_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_roles_on_slug", unique: true
  end

  create_table "system_reports", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "report_type"
    t.json "parameters"
    t.string "status", default: "pending"
    t.datetime "generated_at"
    t.json "summary"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_system_reports_on_organization_id"
  end

  create_table "system_settings", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "company_name"
    t.string "custom_domain"
    t.string "contact_email"
    t.string "transcode_preset", default: "1080p"
    t.string "max_upload_size", default: "1024mb"
    t.boolean "auto_captions", default: true
    t.boolean "auto_chapters", default: true
    t.boolean "enforce_2fa", default: true
    t.integer "session_timeout_minutes", default: 60
    t.string "sso_provider"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_system_settings_on_organization_id"
  end

  create_table "user_roles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id"
    t.bigint "role_id", null: false
    t.string "route_group"
    t.json "permissions", default: []
    t.json "granted_permissions", default: []
    t.json "denied_permissions", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "user_id, COALESCE(organization_id, (0)::bigint), role_id, COALESCE(route_group, ''::character varying)", name: "index_user_roles_on_user_org_role_group", unique: true
    t.index ["organization_id"], name: "index_user_roles_on_organization_id"
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name"
    t.string "last_name"
    t.boolean "approved", default: false, null: false
    t.boolean "profile_completed", default: false, null: false
    t.string "api_token"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.json "permissions", default: []
    t.json "granted_permissions", default: []
    t.json "denied_permissions", default: []
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "videos", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "user_id", null: false
    t.bigint "post_id"
    t.string "title", null: false
    t.text "description"
    t.string "url", null: false
    t.string "media_type", default: "video", null: false
    t.string "format"
    t.string "file_size"
    t.string "resolution"
    t.string "bitrate"
    t.string "thumbnail_url"
    t.integer "duration_seconds"
    t.string "status", default: "ready", null: false
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_videos_on_discarded_at"
    t.index ["organization_id"], name: "index_videos_on_organization_id"
    t.index ["post_id"], name: "index_videos_on_post_id"
    t.index ["user_id"], name: "index_videos_on_user_id"
  end

  create_table "webhooks", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "url"
    t.json "events"
    t.string "status", default: "pending"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_webhooks_on_organization_id"
  end

  add_foreign_key "analytics_data", "organizations"
  add_foreign_key "analytics_data", "posts"
  add_foreign_key "api_tokens", "organizations"
  add_foreign_key "integrations", "organizations"
  add_foreign_key "org_role_permissions", "organizations"
  add_foreign_key "org_role_permissions", "roles"
  add_foreign_key "organization_invitations", "organizations"
  add_foreign_key "organization_invitations", "roles"
  add_foreign_key "posts", "organizations"
  add_foreign_key "posts", "users"
  add_foreign_key "role_permissions", "organizations"
  add_foreign_key "system_reports", "organizations"
  add_foreign_key "system_settings", "organizations"
  add_foreign_key "user_roles", "organizations"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "users"
  add_foreign_key "videos", "organizations"
  add_foreign_key "videos", "posts"
  add_foreign_key "videos", "users"
  add_foreign_key "webhooks", "organizations"
end
