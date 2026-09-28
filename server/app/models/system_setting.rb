# frozen_string_literal: true

class SystemSetting < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Rhino::HasAuditTrail

  rhino_filters :organization_id, :company_name, :custom_domain, :contact_email, :transcode_preset, :max_upload_size, :auto_captions, :auto_chapters, :enforce_2fa, :session_timeout_minutes, :sso_provider
  rhino_sorts :organization_id, :company_name, :custom_domain, :contact_email, :transcode_preset, :max_upload_size, :auto_captions, :auto_chapters, :enforce_2fa, :session_timeout_minutes, :sso_provider, :created_at
  rhino_fields :id, :organization_id, :company_name, :custom_domain, :contact_email, :transcode_preset, :max_upload_size, :auto_captions, :auto_chapters, :enforce_2fa, :session_timeout_minutes, :sso_provider, :created_at
  rhino_includes :organization
  validates :company_name, length: { maximum: 255 }, allow_nil: true
  validates :custom_domain, length: { maximum: 255 }, allow_nil: true
  validates :contact_email, length: { maximum: 255 }, allow_nil: true
  validates :transcode_preset, length: { maximum: 255 }, allow_nil: true
  validates :max_upload_size, length: { maximum: 255 }, allow_nil: true
  validates :auto_captions, inclusion: { in: [true, false] }, allow_nil: true
  validates :auto_chapters, inclusion: { in: [true, false] }, allow_nil: true
  validates :enforce_2fa, inclusion: { in: [true, false] }, allow_nil: true
  validates :session_timeout_minutes, numericality: { only_integer: true }, allow_nil: true
  validates :sso_provider, length: { maximum: 255 }, allow_nil: true
end
