# frozen_string_literal: true

require "test_helper"

# AC-1, AC-9, AC-75, AC-82: Post policy gates and the ownership check.
class PostPolicyTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @post = build_post(organization: @org, user: @manager, title: "Owned by manager")
    # Policies resolve the organization from the request context.
    RequestStore.store[:rhino_organization] = @org
  end

  teardown do
    RequestStore.store[:rhino_organization] = nil
  end

  test "AC-1: content_manager and editor may create posts" do
    assert PostPolicy.new(@manager, Post).create?
    assert PostPolicy.new(@editor, Post).create?
  end

  test "AC-82: a contributor may not create, update or destroy posts" do
    policy = PostPolicy.new(@contributor, @post)
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "AC-82: a contributor may index and show posts" do
    policy = PostPolicy.new(@contributor, @post)
    assert policy.index?
    assert policy.show?
  end

  test "AC-75: a content_manager may update a post they authored" do
    assert PostPolicy.new(@manager, @post).update?
  end

  test "AC-75: a content_manager may not update another author's post" do
    other = build_post(organization: @org, user: @editor, title: "Owned by editor")
    assert_not PostPolicy.new(@manager, other).update?
  end

  test "AC-75: an admin may update any post in the organization" do
    assert PostPolicy.new(@admin, @post).update?
    assert PostPolicy.new(@admin, @post).destroy?
  end

  test "AC-9: an editor may not destroy a post" do
    assert_not PostPolicy.new(@editor, @post).destroy?
  end

  test "AC-1: a contributor's permitted show fields exclude content" do
    fields = PostPolicy.new(@contributor, @post).permitted_attributes_for_show(@contributor)
    assert_not_includes fields, "content"
    assert_includes fields, "title"
  end
end
