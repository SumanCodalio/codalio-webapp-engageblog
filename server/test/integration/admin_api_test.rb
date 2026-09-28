# frozen_string_literal: true

require "test_helper"

# AC-27, AC-28, AC-29, AC-30, AC-31, AC-46, AC-47, AC-48, AC-49, AC-50, AC-51,
# AC-52, AC-55, AC-56, AC-57, AC-58, AC-79, AC-80, AC-81, AC-83: admin-only
# resources, RBAC enforcement, system health and webhook ping.
class AdminApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]

    @integration = Integration.create!(
      organization: @org, name: "HubSpot CRM", category: "Marketing Automation", connected: false
    )
    @webhook = Webhook.create!(
      organization: @org, url: "https://hooks.example.com/a", events: %w[post.published], status: "pending"
    )
    @setting = SystemSetting.create!(organization: @org, company_name: "ContentReach")
    SystemReport.create!(
      organization: @org, report_type: "backup", status: "ready", generated_at: Time.current
    )
  end

  test "AC-27/AC-28: an admin can list users" do
    get "/api/#{@org.slug}/users", headers: auth_headers(@admin)
    assert_response :success
    assert response.parsed_body["data"].is_a?(Array)
  end

  test "AC-27: a content_manager cannot administer users (write is admin-only)" do
    # The member directory is readable by every role (needed for `?include=user`
    # on posts/videos); the /admin/users *route* is gated client-side. The
    # backend boundary is that only an admin may write users.
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { approved: false }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  test "AC-30/AC-31: an admin can update and deactivate a member" do
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { approved: false }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal false, response.parsed_body["approved"]
  end

  test "AC-30: an admin can change a member's role" do
    put "/api/#{@org.slug}/users/#{@editor.id}",
        params: { role_id: @contract[:roles]["content_manager"].id }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    membership = @editor.user_roles.find_by(organization_id: @org.id)
    assert_equal "content_manager", membership.role.slug
  end

  test "AC-29: an admin can invite a member" do
    post "/api/#{@org.slug}/invitations",
         params: { email: "invitee@example.com", role_id: @contract[:roles]["editor"].id }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_includes [200, 201], response.status
  end

  test "AC-46/AC-47: an admin can list and configure integrations" do
    get "/api/#{@org.slug}/integrations", headers: auth_headers(@admin)
    assert_response :success

    put "/api/#{@org.slug}/integrations/#{@integration.id}",
        params: { connected: true, client_id: "abc", api_key: "secret" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal true, response.parsed_body["connected"]
  end

  test "AC-48: a content_manager cannot configure integrations" do
    put "/api/#{@org.slug}/integrations/#{@integration.id}",
        params: { connected: true }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  test "AC-56/AC-81: a content_manager is denied every admin resource" do
    %w[api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@manager)
      assert_response :forbidden, "#{slug} should be denied to content_manager"
    end
  end

  test "AC-57: an admin has full access to admin resources" do
    %w[api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@admin)
      assert_response :success, "#{slug} should be allowed to admin"
    end
  end

  test "AC-58: an editor is denied admin resources" do
    get "/api/#{@org.slug}/system_settings", headers: auth_headers(@editor)
    assert_response :forbidden
  end

  test "AC-49/AC-50/AC-51/AC-52/AC-79: the system health endpoint returns the four tiles" do
    get "/api/#{@org.slug}/system/health", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body
    %w[api_gateway db_replica video_storage security_perimeter].each do |key|
      assert body.key?(key), "expected #{key} in the health payload"
    end
  end

  test "AC-52: a content_manager cannot read system health" do
    get "/api/#{@org.slug}/system/health", headers: auth_headers(@manager)
    assert_response :forbidden
  end

  test "AC-55/AC-80: an admin can trigger a restore from the most recent backup" do
    post "/api/#{@org.slug}/system/restore", headers: auth_headers(@admin)
    assert_response :success
    assert response.parsed_body["backup_id"].present?
  end

  test "AC-55: a content_manager cannot trigger a restore" do
    post "/api/#{@org.slug}/system/restore", headers: auth_headers(@manager)
    assert_response :forbidden
  end

  test "AC-83: a webhook test ping updates its status" do
    post "/api/#{@org.slug}/webhooks/#{@webhook.id}/ping", headers: auth_headers(@admin)
    assert_response :success
    assert_equal "active", @webhook.reload.status
  end

  test "AC-83: a content_manager cannot ping a webhook" do
    post "/api/#{@org.slug}/webhooks/#{@webhook.id}/ping", headers: auth_headers(@manager)
    assert_response :forbidden
  end

  test "AC-61: an admin can update system settings" do
    put "/api/#{@org.slug}/system_settings/#{@setting.id}",
        params: { company_name: "Renamed Org", transcode_preset: "4k" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Renamed Org", response.parsed_body["company_name"]
  end

  test "AC-62: an admin can generate a system report" do
    post "/api/#{@org.slug}/system_reports",
         params: { report_type: "performance", parameters: { range: "30d" }, status: "ready" }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "performance", response.parsed_body["report_type"]
  end
end
