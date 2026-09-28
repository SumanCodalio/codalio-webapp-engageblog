# frozen_string_literal: true

class CreateAnalyticsData < ActiveRecord::Migration[8.0]
  def change
    create_table :analytics_data do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :post, foreign_key: true, null: true
      t.string :event_type
      t.string :visitor_id, null: true
      t.json :event_data, null: true
      t.datetime :recorded_at

      t.timestamps
    end
  end
end
