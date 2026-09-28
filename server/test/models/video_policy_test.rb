# frozen_string_literal: true

require "test_helper"

# AC-13, AC-22, AC-81, AC-82: Video policy gates and admin-only resources.
class VideoPolicyTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]
    @video = Video.create!(
      organization: @org, user: @manager, title: "Asset", url: "https://cdn.example.com/a.mp4"
    )
    RequestStore.store[:rhino_organization] = @org
  end

  teardown do
    RequestStore.store[:rhino_organization] = nil
  end

  test "AC-13: content_manager and editor may create videos" do
    assert VideoPolicy.new(@manager, Video).create?
    assert VideoPolicy.new(@editor, Video).create?
  end

  test "AC-22: a contributor may not create, update or destroy videos" do
    policy = VideoPolicy.new(@contributor, @video)
    assert_not policy.create?
    assert_not policy.update?
    assert_not policy.destroy?
  end

  test "AC-82: a contributor may index and show videos" do
    policy = VideoPolicy.new(@contributor, @video)
    assert policy.index?
    assert policy.show?
  end

  test "AC-81: a content_manager is denied every admin-only resource" do
    %w[integrations api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      policy_class = "#{slug.singularize.camelize}Policy".constantize
      policy = policy_class.new(@manager, nil)
      assert_not policy.index?, "#{slug} index should be denied to content_manager"
      assert_not policy.create?, "#{slug} create should be denied to content_manager"
    end
  end

  test "AC-81: an admin has full access to admin-only resources" do
    %w[integrations api_tokens webhooks system_settings system_reports role_permissions].each do |slug|
      policy_class = "#{slug.singularize.camelize}Policy".constantize
      policy = policy_class.new(@admin, nil)
      assert policy.index?, "#{slug} index should be allowed to admin"
      assert policy.create?, "#{slug} create should be allowed to admin"
    end
  end
end
