# frozen_string_literal: true

require "test_helper"

# AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-22, AC-67, AC-76: Videos CRUD
# and the media-library contract.
class VideosApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @contributor = @contract[:viewer]
    @video = Video.create!(
      organization: @org, user: @manager, title: "Seeded Asset",
      url: "https://cdn.example.com/seeded.mp4", duration_seconds: 300
    )
  end

  test "AC-16: an authenticated member lists tenant-scoped videos" do
    get "/api/#{@org.slug}/videos", headers: auth_headers(@manager)
    assert_response :success
    assert response.parsed_body["data"].any? { |row| row["id"] == @video.id }
  end

  test "AC-13: a content_manager can upload a video" do
    post "/api/#{@org.slug}/videos",
         params: {
           title: "New Upload", url: "https://cdn.example.com/new.mp4",
           media_type: "video", format: "mp4", file_size: "142.4 MB",
           resolution: "1080p", bitrate: "8.2 Mbps", duration_seconds: 525
         }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "New Upload", response.parsed_body["title"]
    # Regression: `format` is a Rails-reserved param name that the engine's
    # params_hash strips; the media-library contract requires it to persist.
    assert_equal "mp4", response.parsed_body["format"]
    assert_equal "142.4 MB", response.parsed_body["file_size"]
    assert_equal "1080p", response.parsed_body["resolution"]
    assert_equal "8.2 Mbps", response.parsed_body["bitrate"]
  end

  test "AC-14: an invalid upload payload is rejected with 422" do
    post "/api/#{@org.slug}/videos",
         params: { title: "Missing url" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
  end

  test "AC-15: a video title and description can be updated" do
    put "/api/#{@org.slug}/videos/#{@video.id}",
        params: { title: "Renamed", description: "A description" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Renamed", response.parsed_body["title"]
    assert_equal "A description", response.parsed_body["description"]
  end

  test "AC-22: a contributor cannot upload a video" do
    post "/api/#{@org.slug}/videos",
         params: { title: "Nope", url: "https://cdn.example.com/nope.mp4" }.to_json,
         headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  test "AC-17/AC-18/AC-76: the response exposes url and the computed duration" do
    get "/api/#{@org.slug}/videos/#{@video.id}", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert_equal "https://cdn.example.com/seeded.mp4", body["url"]
    assert_equal "05:00", body["duration"]
  end

  test "AC-67: the response exposes the extended media fields" do
    get "/api/#{@org.slug}/videos/#{@video.id}", headers: auth_headers(@manager)
    assert_response :success
    %w[media_type format file_size resolution bitrate].each do |key|
      assert response.parsed_body.key?(key), "expected #{key} in the video payload"
    end
  end
end
