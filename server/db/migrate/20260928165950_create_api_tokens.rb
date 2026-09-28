# frozen_string_literal: true

class CreateApiTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :api_tokens do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name
      t.string :token_prefix
      t.datetime :last_used_at, null: true

      t.timestamps
    end
  end
end
