# frozen_string_literal: true

require "test_helper"

# AC-23, AC-24, AC-25, AC-26, AC-34, AC-35, AC-36, AC-63, AC-64, AC-69:
# the authentication lifecycle and the role information the post-login redirect
# depends on.
#
# AuthApiTest covers the basics; this spec pins the full journey — unauthenticated
# denial, credential validation, the org slug the client stores, role resolution
# for the role-conditional redirect, and logout invalidation.
class AuthFlowApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @contributor = @contract[:viewer]
  end

  # AC-23: an unauthenticated request to a protected resource is denied with 401
  # (the client turns this into a redirect to /login).
  test "AC-23: an unauthenticated request is rejected with 401" do
    get "/api/#{@org.slug}/posts"
    assert_response :unauthorized
    assert response.parsed_body["message"].present?
  end

  # AC-23/AC-36: a bogus token is rejected just like a missing one.
  test "AC-23: an invalid bearer token is rejected" do
    get "/api/#{@org.slug}/posts", headers: { "Authorization" => "Bearer not-a-real-token" }
    assert_response :unauthorized
  end

  # AC-24: a valid email/password pair issues a token and reports the
  # organization slug the client must persist.
  test "AC-24: valid credentials issue a token and the organization slug" do
    post "/api/auth/login",
         params: { email: @manager.email, password: "password" }.to_json,
         headers: { "Content-Type" => "application/json" }
    assert_response :success
    body = response.parsed_body
    assert body["token"].present?
    assert_equal @org.slug, body["organization_slug"]
  end

  # AC-24: the issued token authenticates a subsequent request.
  test "AC-24: the issued token authenticates a subsequent request" do
    post "/api/auth/login",
         params: { email: @manager.email, password: "password" }.to_json,
         headers: { "Content-Type" => "application/json" }
    token = response.parsed_body["token"]

    get "/api/#{@org.slug}/posts", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
  end

  # AC-26: a wrong password is rejected with a client-visible message.
  test "AC-26: a wrong password is rejected with a message" do
    post "/api/auth/login",
         params: { email: @manager.email, password: "wrong-password" }.to_json,
         headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
    assert response.parsed_body["message"].present?
  end

  # AC-26: an unknown email is rejected identically (no user enumeration).
  test "AC-26: an unknown email is rejected with a message" do
    post "/api/auth/login",
         params: { email: "nobody@example.com", password: "password" }.to_json,
         headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
    assert response.parsed_body["message"].present?
  end

  # AC-25/AC-63/AC-64: the admin's role resolves to `admin` — the value the
  # client uses to route an admin to /admin rather than /.
  test "AC-25/AC-63: an admin resolves the admin role after login" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body
    assert_equal @org.slug, body.dig("organization", "slug")
    assert body["roles"].any? { |role| role["slug"] == "admin" },
           "expected the admin role so the client redirects to /admin"
    refute body["roles"].any? { |role| role["slug"] == "content_manager" }
  end

  # AC-64: a content team member resolves a non-admin role — the client routes
  # them to / instead of /admin.
  test "AC-64: a content_manager resolves a non-admin role" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert body["roles"].any? { |role| role["slug"] == "content_manager" }
    refute body["roles"].any? { |role| role["slug"] == "admin" }
  end

  test "AC-64: a contributor resolves the contributor role" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@contributor)
    assert_response :success
    assert response.parsed_body["roles"].any? { |role| role["slug"] == "contributor" }
  end

  # AC-69: /me exposes the profile fields the shell renders (name, first/last,
  # approved) and never leaks the api_token.
  test "AC-69: /me exposes profile fields and hides the token" do
    get "/api/#{@org.slug}/me", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body

    %w[id email name first_name last_name approved roles organization].each do |key|
      assert body.key?(key), "expected #{key} on the session payload"
    end
    refute body.key?("api_token"), "the session payload must not leak the api token"
    refute body.key?("password_digest")
  end

  # AC-34: logout succeeds and revokes the token that was used.
  test "AC-34: logout succeeds for an authenticated user" do
    post "/api/auth/logout", headers: auth_headers(@manager)
    assert_response :success
  end

  # AC-35/AC-36: after logout the old token no longer authenticates — the client
  # redirects to /login and cannot reach protected routes.
  test "AC-35/AC-36: the token is invalid after logout" do
    old_token = @manager.api_token

    post "/api/auth/logout", headers: { "Authorization" => "Bearer #{old_token}" }
    assert_response :success

    get "/api/#{@org.slug}/posts", headers: { "Authorization" => "Bearer #{old_token}" }
    assert_response :unauthorized

    get "/api/#{@org.slug}/me", headers: { "Authorization" => "Bearer #{old_token}" }
    assert_response :unauthorized
  end

  # AC-34: logout revokes only the caller's token — a colleague's session is
  # unaffected.
  test "AC-34: logout does not invalidate another user's token" do
    post "/api/auth/logout", headers: auth_headers(@manager)
    assert_response :success

    get "/api/#{@org.slug}/posts", headers: auth_headers(@admin)
    assert_response :success
  end

  # AC-36: an authenticated user cannot reach another tenant's data even with a
  # valid token (404, not 403 — tenant existence is hidden).
  test "AC-36: a valid token cannot cross into another tenant" do
    get "/api/#{@contract[:other_org].slug}/posts", headers: auth_headers(@manager)
    assert_response :not_found
  end
end
