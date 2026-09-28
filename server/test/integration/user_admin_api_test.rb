# frozen_string_literal: true

require "test_helper"

# AC-27, AC-28, AC-29, AC-30, AC-31, AC-32, AC-33, AC-69: content team member
# administration over the real API.
#
# AdminApiTest covers the happy paths; this spec pins the member record's data
# contract (first/last name, approved, role) and the admin-only write boundary.
class UserAdminApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @outsider = @contract[:outsider]
  end

  # AC-28: an admin sees the member list with the fields the admin table
  # renders (name, email, first/last name, approved, role).
  test "AC-28: an admin can list members with the admin table's fields" do
    get "/api/#{@org.slug}/users", headers: auth_headers(@admin)
    assert_response :success
    rows = response.parsed_body["data"]

    row = rows.find { |item| item["email"] == @manager.email }
    assert_not_nil row, "expected the content_manager in the member list"
    %w[id email name approved].each do |key|
      assert row.key?(key), "expected #{key} on the member row"
    end
  end

  # AC-28: the member list is tenant-scoped — another tenant's users never leak.
  test "AC-28: the member list is tenant-scoped" do
    get "/api/#{@org.slug}/users", headers: auth_headers(@admin)
    assert_response :success
    emails = response.parsed_body["data"].map { |row| row["email"] }
    assert_not_includes emails, @outsider.email
  end

  # AC-27: a content_manager may read the directory (needed for `?include=user`)
  # but cannot write it — writes are admin-only.
  test "AC-27: a content_manager cannot create, update or delete members" do
    post "/api/#{@org.slug}/users",
         params: { name: "Rogue", email: "rogue@example.com", password: "password" }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden

    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { approved: false }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden

    delete "/api/#{@org.slug}/users/#{@contributor.id}", headers: auth_headers(@manager)
    assert_response :forbidden
  end

  # AC-27: an editor is likewise denied the member write surface.
  test "AC-27: an editor cannot administer members" do
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { approved: false }.to_json,
        headers: auth_headers(@editor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-29: an admin can create a member account. (Rhino v4 registration is
  # invitation-based, so account creation goes through the invitation flow the
  # admin screen wires to `useInviteUser`.)
  test "AC-29: an admin can invite a new member" do
    post "/api/#{@org.slug}/invitations",
         params: { email: "new.member@example.com", role_id: @contract[:roles]["editor"].id }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_includes [200, 201], response.status
  end

  # AC-29: a content_manager cannot invite members (admin-only surface).
  test "AC-29: a content_manager cannot invite a member" do
    post "/api/#{@org.slug}/invitations",
         params: { email: "nope@example.com", role_id: @contract[:roles]["editor"].id }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-29: an invalid invitation payload is rejected with 422.
  test "AC-29: an invalid invitation payload is rejected with 422" do
    post "/api/#{@org.slug}/invitations",
         params: { email: "" }.to_json,
         headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_includes [422, 400], response.status
  end

  # AC-30: an admin can edit a member's profile fields.
  test "AC-30: an admin can edit a member's details" do
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { name: "Renamed Member", first_name: "Renamed", last_name: "Member" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success

    assert_equal "Renamed Member", @contributor.reload.name
    assert_equal "Renamed", @contributor.first_name
    assert_equal "Member", @contributor.last_name
  end

  # AC-30: an admin can change a member's role via the virtual role_id the
  # admin screen sends; the membership row is synced.
  test "AC-30: an admin can change a member's role" do
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { role_id: @contract[:roles]["content_manager"].id }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success

    membership = @contributor.user_roles.find_by(organization_id: @org.id)
    assert_equal "content_manager", membership.role.slug
  end

  # AC-31: an admin can deactivate a member by clearing the `approved` flag —
  # the seat is revoked without destroying the account.
  test "AC-31: an admin can deactivate a member" do
    @contributor.update!(approved: true)

    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { approved: false }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal false, response.parsed_body["approved"]
    assert_equal false, @contributor.reload.approved
  end

  # AC-31: an admin can delete a member account outright.
  test "AC-31: an admin can delete a member account" do
    assert_difference -> { User.count }, -1 do
      delete "/api/#{@org.slug}/users/#{@contributor.id}", headers: auth_headers(@admin)
    end
    assert_includes [200, 204], response.status
  end

  # AC-32/AC-33: first_name and last_name are stored and returned on the member
  # record the admin table renders.
  test "AC-32/AC-33: first_name and last_name round-trip through the API" do
    user = User.create!(
      name: "Ada Lovelace", email: "ada@example.com", password: "password",
      first_name: "Ada", last_name: "Lovelace"
    )
    UserRole.create!(user: user, organization: @org, role: @contract[:roles]["editor"])

    get "/api/#{@org.slug}/users/#{user.id}", headers: auth_headers(@admin)
    assert_response :success
    assert_equal "Ada", response.parsed_body["first_name"]
    assert_equal "Lovelace", response.parsed_body["last_name"]
  end

  # AC-32/AC-33: an update can change just the first or last name.
  test "AC-32/AC-33: first and last names can be updated independently" do
    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { first_name: "Grace" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Grace", @contributor.reload.first_name

    put "/api/#{@org.slug}/users/#{@contributor.id}",
        params: { last_name: "Hopper" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Hopper", @contributor.reload.last_name
  end

  # AC-69: the users table carries the extended profile columns the admin screen
  # reads, and the api_token is never serialized.
  test "AC-69: the member payload exposes profile flags and hides the token" do
    get "/api/#{@org.slug}/users/#{@manager.id}", headers: auth_headers(@admin)
    assert_response :success
    body = response.parsed_body

    %w[first_name last_name approved profile_completed].each do |key|
      assert body.key?(key), "expected #{key} on the member payload"
    end
    refute body.key?("api_token")
    refute body.key?("password_digest")
  end

  # AC-27: an outsider (admin of another tenant) cannot read this tenant's
  # members.
  test "AC-27: a foreign tenant's admin cannot read this tenant's members" do
    get "/api/#{@org.slug}/users", headers: auth_headers(@outsider)
    assert_response :not_found
  end
end
