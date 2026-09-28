# frozen_string_literal: true

require "test_helper"

# AC-7, AC-8, AC-32, AC-33, AC-69, AC-71: the User profile-field extension.
class UserTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
  end

  test "AC-69/AC-71: the users table stores first_name, last_name, approved and profile_completed" do
    %w[first_name last_name approved profile_completed].each do |column|
      assert_includes User.column_names, column
    end
  end

  test "AC-7/AC-8: approved and profile_completed default to false" do
    user = User.create!(name: "New User", email: "new.user@example.com", password: "password")
    assert_equal false, user.approved
    assert_equal false, user.profile_completed
  end

  test "AC-32/AC-33: first_name and last_name are persisted" do
    user = User.create!(
      name: "Named User", email: "named@example.com", password: "password",
      first_name: "Ada", last_name: "Lovelace"
    )
    assert_equal "Ada", user.reload.first_name
    assert_equal "Lovelace", user.last_name
  end

  test "AC-69: full_name is a computed attribute" do
    user = User.create!(
      name: "Named User", email: "computed@example.com", password: "password",
      first_name: "Grace", last_name: "Hopper"
    )
    assert_equal "Grace Hopper", user.full_name
    assert_equal "Grace Hopper", user.rhino_computed_attributes["full_name"]
  end

  test "AC-69: api_token is hidden from serialization" do
    user = @contract[:admin]
    assert_not user.as_rhino_json.key?("api_token")
  end
end
