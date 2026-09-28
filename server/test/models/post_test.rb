# frozen_string_literal: true

require "test_helper"

# AC-66, AC-72, AC-73, AC-74: Post fields, computed has_video, publish
# transition and slug auto-generation.
class PostTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @user = @contract[:manager]
  end

  test "AC-66: a post exposes slug, category, tags, read_time_minutes, view_count and scheduled_at" do
    post = Post.new(
      organization: @org, user: @user, title: "Field Coverage",
      slug: "field-coverage", category: "Engineering", tags: %w[a b],
      read_time_minutes: 4, view_count: 12, scheduled_at: 1.day.from_now
    )
    assert post.valid?
    assert_equal "field-coverage", post.slug
    assert_equal %w[a b], post.tags
    assert_equal 4, post.read_time_minutes
    assert_equal 12, post.view_count
  end

  test "AC-72: has_video is true when the post has an associated video" do
    post = build_post(organization: @org, user: @user, title: "With Video")
    assert_equal false, post.has_video

    Video.create!(
      organization: @org, user: @user, post: post,
      title: "Attached", url: "https://cdn.example.com/a.mp4"
    )
    assert_equal true, post.reload.has_video
    assert_equal true, post.rhino_computed_attributes["has_video"]
  end

  test "AC-73: publishing sets published_at when blank" do
    post = build_post(organization: @org, user: @user, title: "Publish Me", status: "draft")
    assert_nil post.published_at

    post.update!(status: "published")
    assert_not_nil post.published_at
  end

  test "AC-73: scheduling requires scheduled_at" do
    post = Post.new(organization: @org, user: @user, title: "Scheduled", status: "scheduled")
    assert_not post.valid?
    assert_includes post.errors[:scheduled_at], "can't be blank when status is scheduled"

    post.scheduled_at = 2.days.from_now
    assert post.valid?
  end

  test "AC-74: slug is auto-generated from the title when blank" do
    post = Post.create!(organization: @org, user: @user, title: "Hello World Post")
    assert_equal "hello-world-post", post.slug
  end

  test "AC-74: generated slugs are unique per organization" do
    first = Post.create!(organization: @org, user: @user, title: "Duplicate Title")
    second = Post.create!(organization: @org, user: @user, title: "Duplicate Title")
    assert_equal "duplicate-title", first.slug
    assert_equal "duplicate-title-2", second.slug
  end

  test "AC-66: title is required" do
    post = Post.new(organization: @org, user: @user)
    assert_not post.valid?
    assert_includes post.errors[:title], "can't be blank"
  end

  test "AC-66: status is restricted to the known vocabulary" do
    post = Post.new(organization: @org, user: @user, title: "Bad Status", status: "bogus")
    assert_not post.valid?
    assert post.errors[:status].any?
  end
end
