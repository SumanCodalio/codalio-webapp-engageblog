# frozen_string_literal: true

require "test_helper"

# AC-53, AC-54, AC-80: the daily backup job writes a durable backup record per
# organization (the "stored securely and redundantly" persistence layer) and the
# admin restore endpoint consumes the most recent one.
class BackupJobTest < ActiveSupport::TestCase
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @manager = @contract[:manager]

    build_post(organization: @org, user: @manager, title: "Backup Post")
    Video.create!(
      organization: @org, user: @manager, title: "Backup Video",
      url: "https://cdn.example.com/backup.mp4", duration_seconds: 120
    )
    AnalyticsData.create!(organization: @org, post: Post.first, event_type: "view", visitor_id: "bv1")
  end

  # AC-53: the job runs unattended and produces a `backup` report row for every
  # organization in the system (automated daily backup of all application data).
  test "AC-53: BackupJob writes one backup report per organization" do
    assert_difference -> { SystemReport.where(report_type: "backup").count }, 2 do
      BackupJob.perform_now
    end

    [@contract[:demo_org], @contract[:other_org]].each do |org|
      assert SystemReport.where(organization_id: org.id, report_type: "backup").exists?,
             "expected a backup record for #{org.slug}"
    end
  end

  # AC-54: the backup row persists a machine-readable summary of the tenant's
  # data volume so the backup is recoverable and auditable (stored securely and
  # redundantly rather than only held in memory).
  test "AC-54: the backup record carries a summary of the tenant data volume" do
    BackupJob.perform_now

    backup = SystemReport.where(organization_id: @org.id, report_type: "backup")
                         .order(generated_at: :desc).first
    assert_not_nil backup
    assert_equal "ready", backup.status
    assert_not_nil backup.generated_at

    summary = backup.summary
    assert summary.is_a?(Hash)
    %w[posts videos analytics_events backed_up_at].each do |key|
      assert summary.key?(key), "expected #{key} in the backup summary"
    end
    assert_equal 1, summary["posts"]
    assert_equal 1, summary["videos"]
    assert_equal 1, summary["analytics_events"]
  end

  # AC-53: the job is idempotent — re-running it adds a new dated snapshot
  # rather than duplicating a single mutable row, so a restore can pick any
  # point in time.
  test "AC-53: a second run records a fresh backup snapshot" do
    BackupJob.perform_now
    first = SystemReport.where(organization_id: @org.id, report_type: "backup").maximum(:generated_at)

    travel 1.day do
      BackupJob.perform_now
      latest = SystemReport.where(organization_id: @org.id, report_type: "backup").maximum(:generated_at)
      assert latest > first, "expected a newer backup timestamp after a second run"
    end
  end

  # AC-80: the restore path reads the most recent backup for the request's
  # organization — proven at the model level here (the HTTP path is covered in
  # AdminApiTest).
  test "AC-80: the most recent backup is selectable for restore" do
    BackupJob.perform_now
    travel 2.days do
      BackupJob.perform_now

      latest = SystemReport.where(organization_id: @org.id, report_type: "backup")
                           .order(generated_at: :desc).first
      assert_not_nil latest
      assert latest.generated_at > 1.day.ago
    end
  end
end
