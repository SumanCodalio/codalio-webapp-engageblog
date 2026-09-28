# frozen_string_literal: true

require "test_helper"

# AC-23, AC-24, AC-25, AC-26, AC-34, AC-35, AC-36, AC-63, AC-64: authentication,
# logout and the /me role-resolution endpoint.
class AuthApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
  end

  test "AC-24: valid credentials return a token and the organization slug" do
    post "/api/auth/login",
         params: { email: @admin.email, password: "password" }.to_json,
         headers: { "Content-Type" => "application/json" }
    assert_response :success
    body = response.parsed_body
    assert body["token"].present?
    assert_equal @org.slug, body["organization_slug"]
  end

  test "AC-26: invalid credentials are rejected" do
    post "/api/auth/login",
         params: { email: @admin.email, password: "wrong" }.to_json,
         headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
    assert response.parsed_body["message"].present?
  end

  test "AC-34/AC-35: logout revokes the token" do
    old_token = @admin.api_token
    post "/api/auth/logout", headers: auth_headers(@admin)
    assert_response :success

    get "/api/#{@org.slug}/posts", headers: { "Authorization" => "Bearer #{old_token}" }
    assert_response :unauthorized
  end

  test "AC-36: protected routes reject an unauthenticated request" do
    get "/api/#{@org.slug}/posts"
    assert_response :unauthorized
  end

  test "AC-63/AC-64: /me resolves the signed-in user's roles for the organization" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body
    assert_equal @admin.email, body["email"]
    assert_equal @org.slug, body.dig("organization", "slug")
    assert body["roles"].any? { |role| role["slug"] == "admin" }
  end

  test "AC-64: a content_manager resolves the content_manager role" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@manager)
    assert_response :success
    assert response.parsed_body["roles"].any? { |role| role["slug"] == "content_manager" }
  end

  test "AC-36: /me requires authentication" do
    get "/api/#{@org.slug}/me"
    assert_response :unauthorized
  end
end
