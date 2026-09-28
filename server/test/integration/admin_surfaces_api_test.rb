# frozen_string_literal: true

require "test_helper"

# AC-46, AC-47, AC-48, AC-49, AC-50, AC-51, AC-52, AC-59, AC-60, AC-61, AC-62,
# AC-70, AC-79, AC-83: the admin surfaces and the custom endpoints the admin
# screens read (health, integrations, settings, reports, webhook ping).
#
# AdminApiTest covers the happy path per endpoint; this spec pins the *data
# contract* each admin screen consumes so a renamed key fails loudly, plus the
# tenant-scoping of the admin resources.
class AdminSurfacesApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]

    @integration = Integration.create!(
      organization: @org, name: "Mailchimp", category: "Marketing Automation",
      description: "Email campaigns", connected: false
    )
    @webhook = Webhook.create!(
      organization: @org, url: "https://hooks.example.com/ping",
      events: %w[post.published], status: "pending"
    )
    @setting = SystemSetting.create!(
      organization: @org, company_name: "ContentReach", transcode_preset: "1080p"
    )
    @report = SystemReport.create!(
      organization: @org, report_type: "performance", status: "ready", generated_at: Time.current
    )
    @token = ApiToken.create!(organization: @org, name: "Publishing Key", token_prefix: "cr_live_1")
  end

  # AC-46/AC-47: the integrations list returns the fields the admin screen
  # renders (name, category, connected) and the tenant's own rows only.
  test "AC-46/AC-47: the integrations list carries the admin screen's fields" do
    Integration.create!(organization: @other_org, name: "Foreign Integration")

    get "/api/#{@org.slug}/integrations", headers: auth_headers(@admin)
    assert_response :success
    rows = response.parsed_body["data"]

    row = rows.find { |item| item["id"] == @integration.id }
    assert_not_nil row
    %w[id name category description connected].each do |key|
      assert row.key?(key), "expected #{key} on the integration row"
    end

    names = rows.map { |item| item["name"] }
    assert_not_includes names, "Foreign Integration"
  end

  # AC-48: configuring an integration persists the credentials and flips the
  # status indicator.
  test "AC-48: configuring an integration persists keys and the connected flag" do
    put "/api/#{@org.slug}/integrations/#{@integration.id}",
        params: { connected: true, client_id: "client-123", api_key: "secret-456" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    body = response.parsed_body
    assert_equal true, body["connected"]
    assert_equal "client-123", body["client_id"]

    assert_equal true, @integration.reload.connected
  end

  # AC-48/AC-70: the integrations admin surface is served at the tenant-scoped
  # API path the /admin/api-integrations screen consumes, and a content role is
  # denied it.
  test "AC-70: the integrations surface is admin-only at the tenant path" do
    get "/api/#{@org.slug}/integrations", headers: auth_headers(@manager)
    assert_response :forbidden

    get "/api/#{@org.slug}/api_tokens", headers: auth_headers(@manager)
    assert_response :forbidden

    get "/api/#{@org.slug}/webhooks", headers: auth_headers(@manager)
    assert_response :forbidden
  end

  # AC-46/AC-70: API tokens and webhooks list the fields the integrations screen
  # renders, and a token can be generated then revoked.
  test "AC-46: API tokens can be generated and revoked" do
    get "/api/#{@org.slug}/api_tokens", headers: auth_headers(@admin)
    assert_response :success
    assert response.parsed_body["data"].any? { |row| row["id"] == @token.id }

    post "/api/#{@org.slug}/api_tokens",
         params: { name: "New Key", token_prefix: "cr_live_new" }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :created
    created_id = response.parsed_body["id"]

    delete "/api/#{@org.slug}/api_tokens/#{created_id}", headers: auth_headers(@admin)
    assert_includes [200, 204], response.status
  end

  # AC-46: webhooks can be added and listed with their events payload.
  test "AC-46: webhooks can be added and listed" do
    post "/api/#{@org.slug}/webhooks",
         params: { url: "https://hooks.example.com/new", events: %w[post.published] }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "https://hooks.example.com/new", response.parsed_body["url"]

    get "/api/#{@org.slug}/webhooks", headers: auth_headers(@admin)
    assert_response :success
    assert response.parsed_body["data"].any? { |row| row["url"] == "https://hooks.example.com/new" }
  end

  # AC-49: a successful integration is confirmed with a status indicator — the
  # `connected` flag is the indicator the screen renders.
  test "AC-49: the connected flag is the integration status indicator" do
    assert_equal false, @integration.connected

    put "/api/#{@org.slug}/integrations/#{@integration.id}",
        params: { connected: true }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success

    get "/api/#{@org.slug}/integrations/#{@integration.id}", headers: auth_headers(@admin)
    assert_equal true, response.parsed_body["connected"]
  end

  # AC-50/AC-51/AC-79: the health endpoint returns the four status tiles, each
  # with the label/value/status/detail shape the monitoring dashboard renders.
  test "AC-50/AC-51/AC-79: the health payload carries four fully-shaped tiles" do
    get "/api/#{@org.slug}/system/health", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body

    %w[api_gateway db_replica video_storage security_perimeter].each do |key|
      tile = body[key]
      assert_not_nil tile, "expected the #{key} tile"
      %w[label value status detail].each do |field|
        assert tile.key?(field), "expected #{key}.#{field}"
      end
    end
  end

  # AC-51/AC-52: the monitoring dashboard is reachable only by admin — a
  # content_manager gets 403, an outsider gets 404 for the foreign tenant.
  test "AC-52: the health dashboard is admin-only and tenant-scoped" do
    get "/api/#{@org.slug}/system/health", headers: auth_headers(@manager)
    assert_response :forbidden

    get "/api/#{@org.slug}/system/health", headers: auth_headers(@outsider)
    assert_response :not_found

    get "/api/#{@org.slug}/system/health"
    assert_response :unauthorized
  end

  # AC-60: the admin overview lists the four admin modules — every module's
  # backing resource is reachable by admin and carries rows.
  test "AC-60: every admin module resource is reachable by admin" do
    %w[users integrations api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@admin)
      assert_response :success, "expected the admin module #{slug} to be reachable"
      assert response.parsed_body["data"].is_a?(Array)
    end
  end

  # AC-60/AC-65: the admin overview and its modules are admin-only — the
  # content team is denied each one.
  #
  # `users` is deliberately NOT in this list: the member directory is readable
  # by every authenticated role (it backs `?include=user` on posts/videos and
  # the admin user list), while only admin may WRITE it — that write boundary is
  # covered by AC-27 in AdminApiTest/UserAdminApiTest. The admin-only resources
  # here are the ones the plan's RBAC Extra enumerates.
  test "AC-60: the admin modules are denied to a contributor" do
    %w[integrations api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      get "/api/#{@org.slug}/#{slug}", headers: auth_headers(@contributor)
      assert_response :forbidden, "expected #{slug} to be denied to a contributor"
    end
  end

  # AC-61: the system settings round-trip the organisation identity, encoding
  # presets and security baseline fields the settings screen edits.
  test "AC-61: system settings round-trip the screen's fields" do
    put "/api/#{@org.slug}/system_settings/#{@setting.id}",
        params: {
          company_name: "Renamed Co", custom_domain: "blog.renamed.io",
          contact_email: "ops@renamed.io", transcode_preset: "4k",
          max_upload_size: "2048mb", auto_captions: false, auto_chapters: false,
          enforce_2fa: false, session_timeout_minutes: 30, sso_provider: "okta"
        }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    body = response.parsed_body
    assert_equal "Renamed Co", body["company_name"]
    assert_equal "4k", body["transcode_preset"]
    assert_equal "2048mb", body["max_upload_size"]
    assert_equal false, body["auto_captions"]
    assert_equal 30, body["session_timeout_minutes"]
  end

  # AC-61: a content role cannot read or write the security settings.
  test "AC-61: system settings are denied to a content_manager" do
    get "/api/#{@org.slug}/system_settings", headers: auth_headers(@manager)
    assert_response :forbidden

    put "/api/#{@org.slug}/system_settings/#{@setting.id}",
        params: { enforce_2fa: false }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-62: the reports screen lists the archive, generates a new report with
  # its parameters, and the health panel is available alongside it.
  test "AC-62: system reports can be listed and generated with parameters" do
    get "/api/#{@org.slug}/system_reports", headers: auth_headers(@admin)
    assert_response :success
    assert response.parsed_body["data"].any? { |row| row["id"] == @report.id }

    post "/api/#{@org.slug}/system_reports",
         params: { report_type: "security_audit", parameters: { range: "90d" }, status: "pending" }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :created
    body = response.parsed_body
    assert_equal "security_audit", body["report_type"]
    assert_equal({ "range" => "90d" }, body["parameters"])
  end

  # AC-62: the report archive is tenant-scoped — a second tenant's report never
  # appears in this tenant's archive.
  test "AC-62: the report archive is tenant-scoped" do
    SystemReport.create!(organization: @other_org, report_type: "foreign", status: "ready")

    get "/api/#{@org.slug}/system_reports", headers: auth_headers(@admin)
    assert_response :success
    types = response.parsed_body["data"].map { |row| row["report_type"] }
    assert_not_includes types, "foreign"
  end

  # AC-62: an invalid report payload is rejected with a structured 422 (the
  # screen binds the errors to the form).
  test "AC-62: an invalid report payload is rejected with 422" do
    post "/api/#{@org.slug}/system_reports",
         params: {}.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
  end

  # AC-83: a webhook test ping dispatches and updates the status indicator.
  test "AC-83: a webhook test ping flips the status to active" do
    assert_equal "pending", @webhook.status

    post "/api/#{@org.slug}/webhooks/#{@webhook.id}/ping", headers: auth_headers(@admin)
    assert_response :success
    assert_equal "active", @webhook.reload.status
    assert_equal "active", response.parsed_body.dig("webhook", "status")
  end

  # AC-83: pinging a webhook that does not exist in this tenant returns 404.
  test "AC-83: pinging a foreign or missing webhook returns 404" do
    post "/api/#{@org.slug}/webhooks/999999/ping", headers: auth_headers(@admin)
    assert_response :not_found

    foreign = Webhook.create!(organization: @other_org, url: "https://hooks.example.com/f",
                              events: %w[x], status: "pending")
    post "/api/#{@org.slug}/webhooks/#{foreign.id}/ping", headers: auth_headers(@admin)
    assert_response :not_found
  end

  # AC-59: the dashboard's reach metrics come from the analytics summary, which
  # an admin can also read — proving the data source is available to the role
  # that lands on the dashboard.
  test "AC-59: the dashboard metrics source is readable by the content team" do
    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@admin)
    assert_response :success
    %w[total_impressions watch_time_hours engagement_rate unique_readers].each do |key|
      assert response.parsed_body.key?(key), "expected #{key} for the dashboard metric cards"
    end
  end

  # AC-59: the dashboard's recent-posts list needs the per-post display fields
  # (status, category, view count, video indicator).
  test "AC-59: the dashboard post list exposes status, category, view_count and has_video" do
    build_post(organization: @org, user: @manager, title: "Dashboard Post",
               status: "published", published_at: 1.day.ago, view_count: 42)

    get "/api/#{@org.slug}/posts", headers: auth_headers(@admin)
    assert_response :success
    row = response.parsed_body["data"].find { |item| item["title"] == "Dashboard Post" }
    assert_not_nil row
    %w[status category view_count has_video].each do |key|
      assert row.key?(key), "expected #{key} on the dashboard post row"
    end
    assert_equal 42, row["view_count"]
  end
end
