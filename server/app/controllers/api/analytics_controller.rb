# frozen_string_literal: true

module Api
  # Extra 7: tenant-safe analytics aggregate endpoint.
  #
  #   GET /api/{organization}/analytics/summary?range=30d&content_type=all&interval=day
  #
  # Returns the exact keys the Analytics prototype reads:
  #   total_impressions, unique_readers, engagement_rate, watch_time_hours,
  #   daily_series[], leaderboard[]
  #
  # Every query goes through Rhino.query (never a raw model query) so tenant
  # isolation is enforced and the endpoint fails closed without an org.
  class AnalyticsController < BaseController
    RANGE_DAYS = { "7d" => 7, "30d" => 30, "90d" => 90, "12m" => 365 }.freeze

    def summary
      return if performed?

      authorize_permission!("analytics_data", "index")
      return if performed?

      range = params[:range].presence || "30d"
      content_type = params[:content_type].presence || "all"
      days = RANGE_DAYS[range] || 30
      since = days.days.ago.beginning_of_day

      events = Rhino.query(AnalyticsData).where("recorded_at >= ?", since)
      posts = Rhino.query(Post)

      case content_type
      when "video"
        posts = posts.where(id: Rhino.query(Video).where.not(post_id: nil).select(:post_id))
      when "text"
        posts = posts.where.not(id: Rhino.query(Video).where.not(post_id: nil).select(:post_id))
      end

      post_ids = posts.pluck(:id)

      view_events = events.where(event_type: "view")
      view_events = view_events.where(post_id: post_ids) if post_ids.any?

      total_impressions = view_events.count
      unique_readers = view_events.where.not(visitor_id: nil).distinct.count(:visitor_id)

      engagement_events = events.where(event_type: %w[share comment like])
      engagement_events = engagement_events.where(post_id: post_ids) if post_ids.any?
      engagement_rate = total_impressions.zero? ? 0.0 : ((engagement_events.count.to_f / total_impressions) * 100).round(1)

      watch_seconds = Rhino.query(Video).where(post_id: post_ids).sum(:duration_seconds)
      watch_time_hours = (watch_seconds / 3600.0).round(1)

      render json: {
        total_impressions: total_impressions,
        unique_readers: unique_readers,
        engagement_rate: engagement_rate,
        watch_time_hours: watch_time_hours,
        daily_series: daily_series(view_events, since, days),
        leaderboard: leaderboard(posts, view_events)
      }
    end

    private

    def daily_series(view_events, since, days)
      counts = view_events
               .where("recorded_at >= ?", since)
               .group("DATE(recorded_at)")
               .count

      (0...days).map do |offset|
        date = (since.to_date + offset)
        { "date" => date.iso8601, "impressions" => counts[date] || 0 }
      end
    end

    def leaderboard(posts, view_events)
      counts = view_events.group(:post_id).count

      posts.order(view_count: :desc).limit(10).map do |post|
        {
          "id" => post.id,
          "title" => post.title,
          "category" => post.category,
          "status" => post.status,
          "view_count" => post.view_count,
          "impressions" => counts[post.id] || 0,
          "has_video" => post.videos.any?
        }
      end
    end
  end
end
