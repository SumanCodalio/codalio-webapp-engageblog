# frozen_string_literal: true

class CreateRolePermissions < ActiveRecord::Migration[8.0]
  def change
    create_table :role_permissions do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :capability
      t.text :description, null: true
      t.string :role_key
      t.boolean :enabled

      t.timestamps
    end
  end
end
