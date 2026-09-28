# frozen_string_literal: true

require "test_helper"

# AC-55, AC-56, AC-57, AC-58, AC-65, AC-81, AC-82: exhaustive role-based access
# control over the real API.
#
# The role matrix under test (mirrors db/seeds.rb and the blueprint permission
# layer):
#
#   admin           — every resource, every action
#   content_manager — content resources (full) + member directory (read only)
#   editor          — content resources (edit) + member directory (read only)
#   contributor     — content resources read-only, admin resources denied
#
# Every non-admin role is denied every admin-only resource (the backend half of
# the `/admin/*` client gate).
class RbacTest < ActionDispatch::IntegrationTest
  # The admin-only resource slugs (the five /admin/* surfaces + the permission
  # matrix backing /admin/users).
  ADMIN_RESOURCES = %w[
    integrations api_tokens webhooks system_settings system_reports role_permissions
  ].freeze

  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]

    @post = build_post(organization: @org, user: @manager, title: "RBAC Post")
    @video = Video.create!(
      organization: @org, user: @manager, title: "RBAC Video",
      url: "https://cdn.example.com/rbac.mp4"
    )
  end

  # AC-56: `content_team_member` cannot access /admin routes. Every non-admin
  # role is denied the index of every admin-only resource.
  test "AC-56: a content_manager cannot read any admin resource" do
    ADMIN_RESOURCES.each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@manager)
      assert_response :forbidden, "content_manager should be denied GET /#{slug}"
    end
  end

  # AC-56: the same boundary holds for an editor and a contributor.
  test "AC-56: an editor cannot read any admin resource" do
    ADMIN_RESOURCES.each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@editor)
      assert_response :forbidden, "editor should be denied GET /#{slug}"
    end
  end

  test "AC-56: a contributor cannot read any admin resource" do
    ADMIN_RESOURCES.each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@contributor)
      assert_response :forbidden, "contributor should be denied GET /#{slug}"
    end
  end

  # AC-56: reads are denied, so writes are too — a content_manager cannot even
  # attempt an admin mutation.
  test "AC-56: a content_manager cannot write an admin resource" do
    post "/api/#{@org.slug}/webhooks",
         params: { url: "https://hooks.example.com/x", events: %w[post.published] }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden

    post "/api/#{@org.slug}/api_tokens",
         params: { name: "Rogue", token_prefix: "cr_rogue" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-57: `admin` has full access to all application features and data — every
  # admin resource index succeeds and a create round-trips.
  test "AC-57: an admin can read every admin resource" do
    ADMIN_RESOURCES.each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@admin)
      assert_response :success, "admin should be allowed GET /#{slug}"
    end
  end

  test "AC-57: an admin has full CRUD on the content resources" do
    # create
    post "/api/#{@org.slug}/posts",
         params: { title: "Admin post" }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :created
    created_id = response.parsed_body["id"]

    # read
    get "/api/#{@org.slug}/posts/#{created_id}", headers: auth_headers(@admin)
    assert_response :success

    # update
    put "/api/#{@org.slug}/posts/#{created_id}",
        params: { title: "Admin post edited" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success

    # delete (soft delete — the model includes Discard::Model)
    delete "/api/#{@org.slug}/posts/#{created_id}", headers: auth_headers(@admin)
    assert_includes [200, 204], response.status
  end

  # AC-58: unauthorized attempts are blocked with a recorded, client-visible
  # reason (403 + message) rather than a silent failure or a 500.
  test "AC-58: a blocked attempt returns 403 with an explanatory message" do
    get "/api/#{@org.slug}/system_settings", headers: auth_headers(@manager)
    assert_response :forbidden
    assert response.parsed_body["message"].present?,
           "expected the denial to carry a message the client can surface"
  end

  # AC-58: the audit trail records the mutations that ARE authorized, so the
  # system keeps a durable log of who changed what in the tenant.
  test "AC-58: an authorized admin mutation is written to the audit log" do
    setting = SystemSetting.create!(organization: @org, company_name: "Audit Target")

    put "/api/#{@org.slug}/system_settings/#{setting.id}",
        params: { company_name: "Audit Renamed" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success

    assert Rhino::AuditLog.where(auditable_type: "SystemSetting", auditable_id: setting.id).exists?,
           "expected the authorized change to be recorded in the audit log"
  end

  # AC-65: the /admin/* surfaces are admin-only — the backend boundary the
  # client-side redirect enforces. Every non-admin role is denied, admin is not.
  test "AC-65: only admin may reach the /admin resource set" do
    [@manager, @editor, @contributor].each do |user|
      ADMIN_RESOURCES.each do |slug|
        get "/api/#{@org.slug}/#{slug}", headers: auth_headers(user)
        assert_response :forbidden, "#{user.email} should be denied /#{slug}"
      end
    end

    ADMIN_RESOURCES.each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@admin)
      assert_response :success, "admin should reach /#{slug}"
    end
  end

  # AC-81: RBAC denies the content team every admin resource while admin keeps
  # full access — asserted as a single matrix so a regression in either
  # direction fails.
  test "AC-81: the RBAC matrix denies the content team and allows admin" do
    denied = [@manager, @editor, @contributor]
    ADMIN_RESOURCES.each do |slug|
      denied.each do |user|
        get "/api/#{@org.slug}/#{slug}", headers: auth_headers(user)
        assert_response :forbidden, "#{slug} must be denied to #{user.email}"
      end
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@admin)
      assert_response :success, "#{slug} must be allowed to admin"
    end
  end

  # AC-82: a contributor is read-only — index/show succeed, store/update/destroy
  # are denied on both Post and Video.
  test "AC-82: a contributor may read posts but not write them" do
    get "/api/#{@org.slug}/posts", headers: auth_headers(@contributor)
    assert_response :success

    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@contributor)
    assert_response :success

    post "/api/#{@org.slug}/posts",
         params: { title: "Contributor post" }.to_json,
         headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden

    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Contributor edit" }.to_json,
        headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden

    delete "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@contributor)
    assert_response :forbidden
  end

  test "AC-82: a contributor may read videos but not write them" do
    get "/api/#{@org.slug}/videos", headers: auth_headers(@contributor)
    assert_response :success

    get "/api/#{@org.slug}/videos/#{@video.id}", headers: auth_headers(@contributor)
    assert_response :success

    post "/api/#{@org.slug}/videos",
         params: { title: "Contributor video", url: "https://cdn.example.com/c.mp4" }.to_json,
         headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden

    put "/api/#{@org.slug}/videos/#{@video.id}",
        params: { title: "Contributor video edit" }.to_json,
        headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden

    delete "/api/#{@org.slug}/videos/#{@video.id}", headers: auth_headers(@contributor)
    assert_response :forbidden
  end

  # AC-56/AC-65: an admin resource is denied even when the caller is a member of
  # the organization but holds a content role — the gate is role-based, not
  # merely membership-based.
  test "AC-65: role, not membership, decides the /admin boundary" do
    # The contributor is a demo-org member with read access to posts...
    get "/api/#{@org.slug}/posts", headers: auth_headers(@contributor)
    assert_response :success

    # ...but still cannot reach the admin surface.
    get "/api/#{@org.slug}/system_reports", headers: auth_headers(@contributor)
    assert_response :forbidden
  end
end
