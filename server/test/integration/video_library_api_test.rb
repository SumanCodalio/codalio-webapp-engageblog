# frozen_string_literal: true

require "test_helper"

# AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-22, AC-67, AC-76, AC-82: the
# media-library contract, tenant isolation and validation.
#
# VideosApiTest covers the happy paths; this spec pins the media-library data
# contract, cross-tenant isolation and the required-field 422s.
class VideoLibraryApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]

    @asset = Video.create!(
      organization: @org, user: @manager, title: "Library Asset",
      url: "https://cdn.example.com/library.mp4", media_type: "video",
      format: "mp4", file_size: "142.4 MB", resolution: "1080p",
      bitrate: "8.2 Mbps", duration_seconds: 760, status: "ready"
    )
  end

  # AC-16: the library lists the tenant's uploaded assets with the fields the
  # media screen renders.
  test "AC-16: the media library lists assets with the screen's fields" do
    get "/api/#{@org.slug}/videos", headers: auth_headers(@manager)
    assert_response :success
    row = response.parsed_body["data"].find { |item| item["id"] == @asset.id }
    assert_not_nil row
    %w[id title media_type format file_size resolution bitrate duration url status].each do |key|
      assert row.key?(key), "expected #{key} on the media-library row"
    end
  end

  # AC-16: the library is tenant-scoped — a foreign asset never appears.
  test "AC-16: the media library is tenant-scoped" do
    Video.create!(organization: @other_org, user: @outsider, title: "Foreign Asset",
                  url: "https://cdn.example.com/foreign.mp4")

    get "/api/#{@org.slug}/videos", headers: auth_headers(@manager)
    assert_response :success
    titles = response.parsed_body["data"].map { |row| row["title"] }
    assert_not_includes titles, "Foreign Asset"
  end

  # AC-13: both a content_manager and an editor can upload.
  test "AC-13: an editor can upload a video" do
    post "/api/#{@org.slug}/videos",
         params: { title: "Editor Upload", url: "https://cdn.example.com/editor.mp4" }.to_json,
         headers: auth_headers(@editor).merge("Content-Type" => "application/json")
    assert_response :created
  end

  # AC-14: the accepted formats (MP4, MOV, AVI) persist on the record — the
  # upload UI's visible confirmation includes the stored format.
  test "AC-14: the accepted video formats persist on the asset" do
    %w[mp4 mov avi].each do |fmt|
      post "/api/#{@org.slug}/videos",
           params: {
             title: "#{fmt.upcase} Asset", url: "https://cdn.example.com/a.#{fmt}",
             media_type: "video", format: fmt
           }.to_json,
           headers: auth_headers(@manager).merge("Content-Type" => "application/json")
      assert_response :created
      assert_equal fmt, response.parsed_body["format"]
    end
  end

  # AC-14: the media_type vocabulary is validated — an unknown value is a 422.
  test "AC-14: an unknown media_type is rejected with 422" do
    post "/api/#{@org.slug}/videos",
         params: { title: "Bad Type", url: "https://cdn.example.com/bad.mp4", media_type: "hologram" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
  end

  # AC-15: a title and description can be added to an uploaded asset.
  test "AC-15: a title and description can be added after upload" do
    put "/api/#{@org.slug}/videos/#{@asset.id}",
        params: { title: "Titled", description: "A descriptive summary" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Titled", @asset.reload.title
    assert_equal "A descriptive summary", @asset.description
  end

  # AC-17: the stored duration is exposed both as raw seconds and as the MM:SS
  # display string the player renders.
  test "AC-17: duration_seconds is stored and duration is the display string" do
    get "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert_equal 760, body["duration_seconds"]
    assert_equal "12:40", body["duration"]
  end

  # AC-18: the asset URL is required and returned.
  test "AC-18: the asset url is required and returned" do
    get "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@manager)
    assert_equal "https://cdn.example.com/library.mp4", response.parsed_body["url"]

    post "/api/#{@org.slug}/videos",
         params: { title: "No URL" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body.dig("errors", "url").present?
  end

  # AC-22: a contributor cannot upload, but can read the library.
  test "AC-22: a contributor can read but not write the media library" do
    get "/api/#{@org.slug}/videos", headers: auth_headers(@contributor)
    assert_response :success

    post "/api/#{@org.slug}/videos",
         params: { title: "Nope", url: "https://cdn.example.com/nope.mp4" }.to_json,
         headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-67: the extended media metadata round-trips (the asset inspector reads
  # these).
  test "AC-67: the extended media metadata round-trips" do
    put "/api/#{@org.slug}/videos/#{@asset.id}",
        params: {
          format: "mov", file_size: "215.8 MB", resolution: "4K UHD (3840x2160)",
          bitrate: "12.4 Mbps", thumbnail_url: "https://cdn.example.com/thumb.jpg",
          description: "Inspector description"
        }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    body = response.parsed_body
    assert_equal "mov", body["format"]
    assert_equal "215.8 MB", body["file_size"]
    assert_equal "4K UHD (3840x2160)", body["resolution"]
    assert_equal "12.4 Mbps", body["bitrate"]
    assert_equal "https://cdn.example.com/thumb.jpg", body["thumbnail_url"]
  end

  # AC-67: post_id is nullable — standalone media-library assets exist.
  test "AC-67: a standalone asset has no post" do
    assert_nil @asset.post_id
    get "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@manager)
    assert_response :success
    assert_nil response.parsed_body["post_id"]
  end

  # AC-76: duration is nil (not "00:00") when no duration is known.
  test "AC-76: duration is nil when duration_seconds is nil" do
    untimed = Video.create!(
      organization: @org, user: @manager, title: "Untimed",
      url: "https://cdn.example.com/untimed.mp4"
    )
    get "/api/#{@org.slug}/videos/#{untimed.id}", headers: auth_headers(@manager)
    assert_response :success
    assert_nil response.parsed_body["duration"]
  end

  # AC-76: a sub-minute duration renders as 00:SS.
  test "AC-76: a sub-minute duration renders as 00:SS" do
    short = Video.create!(
      organization: @org, user: @manager, title: "Short",
      url: "https://cdn.example.com/short.mp4", duration_seconds: 45
    )
    get "/api/#{@org.slug}/videos/#{short.id}", headers: auth_headers(@manager)
    assert_equal "00:45", response.parsed_body["duration"]
  end

  # AC-82: a contributor may show a video but not delete it.
  test "AC-82: a contributor cannot delete an asset" do
    get "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@contributor)
    assert_response :success

    delete "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@contributor)
    assert_response :forbidden
  end

  # AC-16: cross-tenant reads of a specific asset are hidden with 404.
  test "AC-16: a foreign tenant cannot read this tenant's asset" do
    get "/api/#{@org.slug}/videos/#{@asset.id}", headers: auth_headers(@outsider)
    assert_response :not_found
  end
end
