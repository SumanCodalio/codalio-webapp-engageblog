# frozen_string_literal: true

class CreateWebhooks < ActiveRecord::Migration[8.0]
  def change
    create_table :webhooks do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :url
      t.json :events, null: true
      t.string :status, default: "pending"

      t.timestamps
    end
  end
end
