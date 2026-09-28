# frozen_string_literal: true

require "test_helper"

# AC-45, AC-78: AnalyticsData event_type and view-event recording with visitor_id.
class AnalyticsDataTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @user = @contract[:manager]
    @post = build_post(organization: @org, user: @user, title: "Analytics Post")
  end

  test "AC-45: event_type is stored and required" do
    record = AnalyticsData.new(organization: @org, post: @post, event_type: "view")
    assert record.valid?
    assert_equal "view", record.event_type

    blank = AnalyticsData.new(organization: @org, post: @post)
    assert_not blank.valid?
    assert_includes blank.errors[:event_type], "can't be blank"
  end

  test "AC-78: a view event records a visitor_id and defaults recorded_at" do
    record = AnalyticsData.create!(
      organization: @org, post: @post, event_type: "view", visitor_id: "visitor-abc"
    )
    assert_equal "visitor-abc", record.visitor_id
    assert_not_nil record.recorded_at
  end

  test "AC-78: unique readers are the distinct visitor_ids" do
    AnalyticsData.create!(organization: @org, post: @post, event_type: "view", visitor_id: "v1")
    AnalyticsData.create!(organization: @org, post: @post, event_type: "view", visitor_id: "v1")
    AnalyticsData.create!(organization: @org, post: @post, event_type: "view", visitor_id: "v2")

    assert_equal 2, AnalyticsData.where(event_type: "view").distinct.count(:visitor_id)
  end
end
