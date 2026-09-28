# frozen_string_literal: true

class CreateOrganizationInvitations < ActiveRecord::Migration[8.0]
  def change
    create_table :organization_invitations do |t|
      t.references :organization, null: true, foreign_key: true
      t.references :role, null: true, foreign_key: true
      t.bigint :invited_by
      t.string :email, null: false
      t.string :token, null: false
      t.string :status, null: false, default: "pending"
      t.string :route_group
      t.datetime :expires_at
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :organization_invitations, :token, unique: true
    add_index :organization_invitations, :email
    add_index :organization_invitations, :status
  end
end
