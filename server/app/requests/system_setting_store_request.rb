# frozen_string_literal: true

# Validation for POST /{resource} on SystemSetting.
class SystemSettingStoreRequest < Rhino::ResourceRequest
  attribute :company_name, :string
  attribute :custom_domain, :string
  attribute :contact_email, :string
  attribute :transcode_preset, :string
  attribute :max_upload_size, :string
  attribute :auto_captions, :boolean
  attribute :auto_chapters, :boolean
  attribute :enforce_2fa, :boolean
  attribute :session_timeout_minutes, :integer
  attribute :sso_provider, :string

  validates :auto_captions, inclusion: { in: [true, false] }, allow_nil: true
  validates :auto_chapters, inclusion: { in: [true, false] }, allow_nil: true
  validates :enforce_2fa, inclusion: { in: [true, false] }, allow_nil: true
  validates :session_timeout_minutes, numericality: { only_integer: true }, allow_nil: true
end
