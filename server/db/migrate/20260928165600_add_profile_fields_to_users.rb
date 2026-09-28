# frozen_string_literal: true

class AddProfileFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :first_name, :string
    add_column :users, :last_name, :string
    add_column :users, :approved, :boolean, null: false, default: false
    add_column :users, :profile_completed, :boolean, null: false, default: false
    add_column :users, :api_token, :string
    add_column :users, :reset_password_token, :string
    add_column :users, :reset_password_sent_at, :datetime
    add_column :users, :permissions, :json, default: []
    add_column :users, :granted_permissions, :json, default: []
    add_column :users, :denied_permissions, :json, default: []

    add_index :users, :api_token, unique: true
  end
end
