# frozen_string_literal: true

require "test_helper"

# AC-37, AC-38, AC-40, AC-41, AC-42, AC-43, AC-44, AC-45, AC-68, AC-77, AC-78:
# the tenant-safe analytics aggregate endpoint and event recording.
class AnalyticsApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]

    @post = build_post(organization: @org, user: @manager, title: "Analytics Post")
    @video = Video.create!(
      organization: @org, user: @manager, post: @post, title: "Analytics Video",
      url: "https://cdn.example.com/analytics.mp4", duration_seconds: 3600
    )
    AnalyticsData.create!(organization: @org, post: @post, event_type: "view", visitor_id: "v1")
    AnalyticsData.create!(organization: @org, post: @post, event_type: "view", visitor_id: "v2")
    AnalyticsData.create!(organization: @org, post: @post, event_type: "share", visitor_id: "v1")
  end

  test "AC-38/AC-68: the summary returns the dashboard aggregate keys" do
    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    %w[total_impressions unique_readers engagement_rate watch_time_hours daily_series leaderboard].each do |key|
      assert body.key?(key), "expected #{key} in the analytics summary"
    end
    assert_equal 2, body["total_impressions"]
    assert_equal 2, body["unique_readers"]
  end

  test "AC-40: the leaderboard carries per-post metrics" do
    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@manager)
    assert_response :success
    row = response.parsed_body["leaderboard"].find { |item| item["id"] == @post.id }
    assert_not_nil row
    assert row.key?("view_count")
    assert row.key?("has_video")
  end

  test "AC-41/AC-42: the range and content_type filters are accepted" do
    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "7d", content_type: "video" },
        headers: auth_headers(@manager)
    assert_response :success
    assert response.parsed_body.key?("daily_series")
  end

  test "AC-43/AC-44: the daily series reflects the requested window" do
    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "7d" },
        headers: auth_headers(@manager)
    assert_response :success
    assert_equal 7, response.parsed_body["daily_series"].length
  end

  test "AC-37: a contributor may read the analytics summary" do
    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@contributor)
    assert_response :success
  end

  test "AC-37: an unauthenticated request is rejected" do
    get "/api/#{@org.slug}/analytics/summary"
    assert_response :unauthorized
  end

  test "AC-68: the summary is tenant-scoped" do
    other_post = build_post(organization: @other_org, user: @outsider, title: "Other analytics post")
    AnalyticsData.create!(organization: @other_org, post: other_post, event_type: "view", visitor_id: "other")

    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@manager)
    assert_response :success
    assert_equal 2, response.parsed_body["total_impressions"]
  end

  test "AC-45/AC-78: a view event can be recorded with a visitor_id" do
    post "/api/#{@org.slug}/analytics_data",
         params: { post_id: @post.id, event_type: "view", visitor_id: "recorded-visitor" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "recorded-visitor", response.parsed_body["visitor_id"]
  end

  test "AC-45: an event without an event_type is rejected with 422" do
    post "/api/#{@org.slug}/analytics_data",
         params: { post_id: @post.id }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
  end
end
