# frozen_string_literal: true

require "test_helper"

# AC-67, AC-76: Video fields and the computed duration display string.
class VideoTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @user = @contract[:manager]
  end

  test "AC-67: a video exposes media_type, format, file_size, resolution, bitrate and description" do
    video = Video.new(
      organization: @org, user: @user, title: "Asset", url: "https://cdn.example.com/a.mp4",
      media_type: "video", format: "mp4", file_size: "142.4 MB",
      resolution: "1080p", bitrate: "8.2 Mbps", description: "A clip"
    )
    assert video.valid?
    assert_equal "video", video.media_type
    assert_equal "mp4", video.format
    assert_equal "142.4 MB", video.file_size
    assert_equal "1080p", video.resolution
    assert_equal "8.2 Mbps", video.bitrate
  end

  test "AC-67: post_id is nullable so media-library assets are standalone" do
    video = Video.create!(
      organization: @org, user: @user, title: "Standalone",
      url: "https://cdn.example.com/standalone.mp4"
    )
    assert_nil video.post_id
    assert video.valid?
  end

  test "AC-76: duration is a MM:SS display string derived from duration_seconds" do
    video = Video.new(
      organization: @org, user: @user, title: "Timed",
      url: "https://cdn.example.com/timed.mp4", duration_seconds: 525
    )
    assert_equal "08:45", video.duration
    assert_equal "08:45", video.rhino_computed_attributes["duration"]
  end

  test "AC-76: duration is nil when duration_seconds is nil" do
    video = Video.new(organization: @org, user: @user, title: "Untimed", url: "https://cdn.example.com/u.mp4")
    assert_nil video.duration
  end

  test "AC-67: title and url are required" do
    video = Video.new(organization: @org, user: @user)
    assert_not video.valid?
    assert_includes video.errors[:title], "can't be blank"
    assert_includes video.errors[:url], "can't be blank"
  end
end
