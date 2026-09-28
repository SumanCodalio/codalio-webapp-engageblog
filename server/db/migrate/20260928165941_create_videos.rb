# frozen_string_literal: true

class CreateVideos < ActiveRecord::Migration[8.0]
  def change
    create_table :videos do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :post, null: true, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :url, null: false
      t.string :media_type, null: false, default: "video"
      t.string :format
      t.string :file_size
      t.string :resolution
      t.string :bitrate
      t.string :thumbnail_url
      t.integer :duration_seconds
      t.string :status, null: false, default: "ready"
      t.datetime :discarded_at
      t.index :discarded_at

      t.timestamps
    end
  end
end
