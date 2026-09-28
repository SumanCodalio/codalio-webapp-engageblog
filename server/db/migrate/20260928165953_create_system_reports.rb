# frozen_string_literal: true

class CreateSystemReports < ActiveRecord::Migration[8.0]
  def change
    create_table :system_reports do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :report_type
      t.json :parameters, null: true
      t.string :status, default: "pending"
      t.datetime :generated_at, null: true
      t.json :summary, null: true

      t.timestamps
    end
  end
end
