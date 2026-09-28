# frozen_string_literal: true

class CreateIntegrations < ActiveRecord::Migration[8.0]
  def change
    create_table :integrations do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name
      t.string :category, null: true
      t.text :description, null: true
      t.boolean :connected
      t.string :client_id, null: true
      t.string :api_key, null: true
      t.boolean :auto_sync, default: true

      t.timestamps
    end
  end
end
