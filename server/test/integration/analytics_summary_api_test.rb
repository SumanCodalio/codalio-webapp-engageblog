# frozen_string_literal: true

require "test_helper"

# AC-37, AC-38, AC-39, AC-40, AC-41, AC-42, AC-43, AC-44, AC-68, AC-77:
# the analytics dashboard aggregate — the numeric contract, the visual series
# the chart renders, and the range/content-type filters.
#
# AnalyticsApiTest covers the endpoint's shape and tenancy; this spec pins the
# computed values so a regression in the aggregation maths fails loudly.
class AnalyticsSummaryApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]

    # A text post with two unique readers and one share.
    @text_post = build_post(
      organization: @org, user: @manager, title: "Text Story",
      status: "published", published_at: 2.days.ago, view_count: 10
    )
    AnalyticsData.create!(organization: @org, post: @text_post, event_type: "view",
                          visitor_id: "reader-a", recorded_at: 2.days.ago)
    AnalyticsData.create!(organization: @org, post: @text_post, event_type: "view",
                          visitor_id: "reader-b", recorded_at: 1.day.ago)
    AnalyticsData.create!(organization: @org, post: @text_post, event_type: "share",
                          visitor_id: "reader-a", recorded_at: 1.day.ago)

    # A video post with one reader and a 2-hour video (watch time).
    @video_post = build_post(
      organization: @org, user: @editor, title: "Video Story",
      status: "published", published_at: 1.day.ago, view_count: 5
    )
    Video.create!(
      organization: @org, user: @editor, post: @video_post, title: "Companion Video",
      url: "https://cdn.example.com/companion.mp4", duration_seconds: 7200
    )
    AnalyticsData.create!(organization: @org, post: @video_post, event_type: "view",
                          visitor_id: "reader-c", recorded_at: 1.day.ago)
  end

  # AC-38: the headline totals are computed correctly — total views and unique
  # visitors across all content.
  test "AC-38: total impressions and unique readers are computed correctly" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body

    # 3 view events, 3 distinct visitors (reader-a/b/c)
    assert_equal 3, body["total_impressions"]
    assert_equal 3, body["unique_readers"]
  end

  # AC-38: the engagement rate is the ratio of engagement events to impressions,
  # expressed as a percentage.
  test "AC-38: the engagement rate reflects shares against impressions" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success

    # 1 share / 3 views => 33.3%
    assert_equal 33.3, response.parsed_body["engagement_rate"]
  end

  # AC-38/AC-68: watch time is derived from the duration of the videos attached
  # to the tenant's posts.
  test "AC-38: watch time hours aggregate the attached video durations" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    assert_equal 2.0, response.parsed_body["watch_time_hours"]
  end

  # AC-39: the daily series is a dense, chartable array — one dated bucket per
  # day in the window, each carrying an impressions count.
  test "AC-39: the daily series is a dense dated array of impression buckets" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "7d" }, headers: auth_headers(@manager)
    assert_response :success
    series = response.parsed_body["daily_series"]

    assert_equal 7, series.length
    series.each do |bucket|
      assert bucket.key?("date"), "each chart bucket needs a date"
      assert bucket.key?("impressions"), "each chart bucket needs an impressions count"
      assert_kind_of Integer, bucket["impressions"]
    end
    # Dates are ascending so the chart renders left-to-right.
    dates = series.map { |b| b["date"] }
    assert_equal dates.sort, dates
  end

  # AC-39: the series total equals the headline impressions count (the chart and
  # the cards agree).
  test "AC-39: the daily series sums to the headline impressions" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert_equal body["total_impressions"], body["daily_series"].sum { |b| b["impressions"] }
  end

  # AC-40: the leaderboard carries per-post metrics — one row per post with its
  # own view count and video indicator.
  test "AC-40: the leaderboard carries per-post metrics" do
    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    leaderboard = response.parsed_body["leaderboard"]

    text_row = leaderboard.find { |row| row["id"] == @text_post.id }
    video_row = leaderboard.find { |row| row["id"] == @video_post.id }

    assert_not_nil text_row
    assert_not_nil video_row
    assert_equal false, text_row["has_video"]
    assert_equal true, video_row["has_video"]
    assert_equal 2, text_row["impressions"]
    assert_equal 1, video_row["impressions"]
  end

  # AC-41: the range filter is honoured — a shorter window drops older events.
  test "AC-41: the range filter narrows the window" do
    # Add an event 40 days ago (outside a 7d window, inside a 90d window).
    AnalyticsData.create!(organization: @org, post: @text_post, event_type: "view",
                          visitor_id: "old-reader", recorded_at: 40.days.ago)

    get "/api/#{@org.slug}/analytics/summary", params: { range: "7d" }, headers: auth_headers(@manager)
    assert_response :success
    short_total = response.parsed_body["total_impressions"]

    get "/api/#{@org.slug}/analytics/summary", params: { range: "90d" }, headers: auth_headers(@manager)
    assert_response :success
    long_total = response.parsed_body["total_impressions"]

    assert short_total < long_total,
           "a 7d window (#{short_total}) should exclude events a 90d window (#{long_total}) includes"
  end

  # AC-42: the content-type filter splits video posts from text posts.
  test "AC-42: the content_type filter isolates video posts" do
    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "30d", content_type: "video" },
        headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body

    # Only the video post's single view event counts.
    assert_equal 1, body["total_impressions"]
    ids = body["leaderboard"].map { |row| row["id"] }
    assert_includes ids, @video_post.id
    assert_not_includes ids, @text_post.id
  end

  test "AC-42: the content_type filter isolates text posts" do
    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "30d", content_type: "text" },
        headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body

    assert_equal 2, body["total_impressions"]
    ids = body["leaderboard"].map { |row| row["id"] }
    assert_includes ids, @text_post.id
    assert_not_includes ids, @video_post.id
  end

  # AC-43: a filtered request reflects the filter immediately — the same
  # endpoint returns a different, correct payload as the filter changes (the
  # "real-time update" the criterion describes).
  test "AC-43: changing the filter changes the returned payload immediately" do
    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "30d", content_type: "all" },
        headers: auth_headers(@manager)
    assert_response :success
    all_total = response.parsed_body["total_impressions"]

    get "/api/#{@org.slug}/analytics/summary",
        params: { range: "30d", content_type: "video" },
        headers: auth_headers(@manager)
    assert_response :success
    video_total = response.parsed_body["total_impressions"]

    assert_equal 3, all_total
    assert_equal 1, video_total
    assert_not_equal all_total, video_total
  end

  # AC-44: event_type is the dimension the aggregation groups on — only `view`
  # events count toward impressions, other types feed engagement.
  test "AC-44: only view events count toward impressions" do
    AnalyticsData.create!(organization: @org, post: @text_post, event_type: "comment",
                          visitor_id: "reader-d", recorded_at: 1.day.ago)

    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body

    # The comment event must not inflate impressions...
    assert_equal 3, body["total_impressions"]
    # ...but it does raise engagement (1 share + 1 comment over 3 views).
    assert_equal 66.7, body["engagement_rate"]
  end

  # AC-68: the aggregate is tenant-safe — a second tenant's events never leak in.
  test "AC-68: the aggregate is tenant-scoped" do
    other_post = build_post(organization: @other_org, user: @outsider, title: "Other Story")
    AnalyticsData.create!(organization: @other_org, post: other_post, event_type: "view",
                          visitor_id: "other-reader", recorded_at: 1.day.ago)

    get "/api/#{@org.slug}/analytics/summary", params: { range: "30d" }, headers: auth_headers(@manager)
    assert_response :success
    assert_equal 3, response.parsed_body["total_impressions"]

    ids = response.parsed_body["leaderboard"].map { |row| row["id"] }
    assert_not_includes ids, other_post.id
  end

  # AC-77: the aggregate endpoint is gated on the analytics permission — a
  # contributor may read it (read-only role) while an outsider gets a 404 for
  # the foreign tenant.
  test "AC-77: the aggregate endpoint respects the permission gate and tenancy" do
    get "/api/#{@org.slug}/analytics/summary", headers: auth_headers(@contributor)
    assert_response :success

    get "/api/#{@other_org.slug}/analytics/summary", headers: auth_headers(@outsider)
    assert_response :success

    # A demo-org member cannot read another tenant's summary.
    get "/api/#{@other_org.slug}/analytics/summary", headers: auth_headers(@manager)
    assert_response :not_found
  end

  # AC-37: an unauthenticated caller is rejected outright.
  test "AC-37: the summary requires authentication" do
    get "/api/#{@org.slug}/analytics/summary"
    assert_response :unauthorized
  end
end
