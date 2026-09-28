# frozen_string_literal: true

require "test_helper"

# AC-71, AC-84: the seed contract — one Role row per canonical role, a
# membership per demo persona, and a working permission chain end-to-end.
#
# db/seeds.rb is idempotent and re-runnable; this spec exercises the same
# contract the helper builds so a broken seed is caught before the runtime does.
class SeedsTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @other_org = @contract[:other_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
  end

  # AC-84: a Role row exists for each of the four canonical roles.
  test "AC-84: a role row exists for admin, content_manager, editor and contributor" do
    %w[admin content_manager editor contributor].each do |slug|
      role = Role.find_by(slug: slug)
      assert_not_nil role, "expected a Role row for #{slug}"
      assert_not_nil role.name
    end
  end

  # AC-84: every demo persona holds a membership in the demo organization with
  # the expected role.
  test "AC-84: each demo persona holds the expected membership" do
    expectations = {
      @admin => "admin",
      @manager => "content_manager",
      @editor => "editor",
      @contributor => "contributor"
    }

    expectations.each do |user, expected_role|
      membership = UserRole.find_by(user_id: user.id, organization_id: @org.id)
      assert_not_nil membership, "expected #{user.email} to be a demo-org member"
      assert_equal expected_role, membership.role.slug,
                   "#{user.email} should hold the #{expected_role} role"
    end
  end

  # AC-84: the seeded permission chain resolves end-to-end —
  # `has_permission?` consults the role layer and answers for the org.
  test "AC-84: the seeded permission chain resolves for every role" do
    assert @admin.has_permission?("posts.index", @org)
    assert @admin.has_permission?("integrations.index", @org)

    assert @manager.has_permission?("posts.index", @org)
    assert @manager.has_permission?("posts.store", @org)
    refute @manager.has_permission?("integrations.index", @org)

    assert @editor.has_permission?("posts.update", @org)
    refute @editor.has_permission?("webhooks.index", @org)

    assert @contributor.has_permission?("posts.index", @org)
    refute @contributor.has_permission?("posts.store", @org)
    refute @contributor.has_permission?("system_settings.index", @org)
  end

  # AC-84: permissions are per-organization — the admin of the second tenant
  # gets the admin grants there, and a demo-org-only role does not leak across.
  test "AC-84: permissions are scoped per organization" do
    outsider = @contract[:outsider]
    assert outsider.has_permission?("integrations.index", @other_org)
    refute @manager.has_permission?("posts.index", @other_org),
           "a demo-org membership must not grant access to another tenant"
  end

  # AC-71: the User schema extension is materialized in the seeded rows —
  # the demo personas carry names and profile flags.
  test "AC-71: seeded users carry the profile-field extension" do
    assert_equal "Administrator", @admin.name
    assert_not_nil @admin.first_name
    assert_not_nil @admin.last_name
    assert_includes [true, false], @admin.approved
    assert_includes [true, false], @admin.profile_completed
  end

  # AC-84: seeding is idempotent — running the helper twice does not create
  # duplicate roles, memberships or organizations.
  test "AC-84: the seed contract is idempotent" do
    counts = {
      roles: Role.count,
      orgs: Organization.count,
      memberships: UserRole.count
    }

    seed_contract

    assert_equal counts[:roles], Role.count
    assert_equal counts[:orgs], Organization.count
    assert_equal counts[:memberships], UserRole.count
  end
end
