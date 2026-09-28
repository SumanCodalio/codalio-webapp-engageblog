# frozen_string_literal: true

# Extra 10: daily backup job.
#
# Writes a `backup` SystemReport row per organization, recording a summary of
# the tenant's data volume. Scheduled via config/recurring.yml.
class BackupJob < ApplicationJob
  queue_as :default

  def perform
    Organization.find_each do |organization|
      Rhino.for_user(nil).in_organization(organization).run do
        summary = {
          "posts" => Rhino.query(Post).count,
          "videos" => Rhino.query(Video).count,
          "analytics_events" => Rhino.query(AnalyticsData).count,
          "backed_up_at" => Time.current.iso8601
        }

        SystemReport.create!(
          organization_id: organization.id,
          report_type: "backup",
          status: "ready",
          generated_at: Time.current,
          summary: summary
        )
      end
    end
  end
end
