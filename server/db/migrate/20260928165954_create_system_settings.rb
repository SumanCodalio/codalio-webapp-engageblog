# frozen_string_literal: true

class CreateSystemSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :system_settings do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :company_name, null: true
      t.string :custom_domain, null: true
      t.string :contact_email, null: true
      t.string :transcode_preset, default: "1080p"
      t.string :max_upload_size, default: "1024mb"
      t.boolean :auto_captions, default: true
      t.boolean :auto_chapters, default: true
      t.boolean :enforce_2fa, default: true
      t.integer :session_timeout_minutes, default: 60
      t.string :sso_provider, null: true

      t.timestamps
    end
  end
end
