# frozen_string_literal: true

class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug
      t.text :content
      t.string :category
      t.json :tags
      t.string :status, null: false, default: "draft"
      t.integer :read_time_minutes
      t.integer :view_count, null: false, default: 0
      t.datetime :published_at
      t.datetime :scheduled_at
      t.datetime :discarded_at
      t.index :discarded_at

      t.timestamps
    end
  end
end
