# frozen_string_literal: true

require "test_helper"

# AC-1, AC-3, AC-5, AC-6, AC-9, AC-10, AC-12, AC-75, AC-82: Posts CRUD,
# validation, ownership and tenant isolation over the real API.
class PostsApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]
    @post = build_post(organization: @org, user: @manager, title: "Seeded Post")
  end

  test "AC-6: an authenticated member lists tenant-scoped posts" do
    get "/api/#{@org.slug}/posts", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert body["data"].is_a?(Array)
    assert body["data"].any? { |row| row["id"] == @post.id }
  end

  test "AC-1: an unauthenticated request is rejected" do
    get "/api/#{@org.slug}/posts"
    assert_response :unauthorized
  end

  test "AC-1: a content_manager can create a post" do
    post "/api/#{@org.slug}/posts",
         params: { title: "Created by manager", content: "Body", status: "draft" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "Created by manager", response.parsed_body["title"]
  end

  test "AC-82: a contributor cannot create a post" do
    post "/api/#{@org.slug}/posts",
         params: { title: "Contributor attempt" }.to_json,
         headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  test "AC-3: an invalid payload is rejected with a structured 422" do
    post "/api/#{@org.slug}/posts",
         params: {}.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
  end

  test "AC-5: publishing a post sets published_at" do
    draft = build_post(organization: @org, user: @manager, title: "Draft to publish", status: "draft")
    put "/api/#{@org.slug}/posts/#{draft.id}",
        params: { status: "published" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_not_nil response.parsed_body["published_at"]
  end

  test "AC-9/AC-75: a content_manager cannot update another author's post" do
    other = build_post(organization: @org, user: @editor, title: "Editor owned")
    put "/api/#{@org.slug}/posts/#{other.id}",
        params: { title: "Hijacked" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  test "AC-10/AC-12: an admin can update any post" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Admin updated" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Admin updated", response.parsed_body["title"]
  end

  test "AC-6: cross-tenant reads are hidden" do
    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@outsider)
    assert_response :not_found
  end

  test "AC-6: the second tenant only sees its own posts" do
    other_post = build_post(organization: @other_org, user: @outsider, title: "Other org post")
    get "/api/#{@other_org.slug}/posts", headers: auth_headers(@outsider)
    assert_response :success
    ids = response.parsed_body["data"].map { |row| row["id"] }
    assert_includes ids, other_post.id
    assert_not_includes ids, @post.id
  end

  test "AC-66: the list response exposes the computed has_video attribute" do
    get "/api/#{@org.slug}/posts", headers: auth_headers(@manager)
    assert_response :success
    row = response.parsed_body["data"].find { |item| item["id"] == @post.id }
    assert row.key?("has_video")
  end
end
