class CreateWorkspaceMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :workspace_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :workspace, null: false, foreign_key: { to_table: :workspaces }, type: :string
      t.string :role, default: 'member'
      t.string :status, default: 'active'
      t.datetime :joined_at
      t.datetime :left_at
      t.datetime :last_activity_at
      t.timestamps
    end

    add_index :workspace_memberships, [:user_id, :workspace_id], unique: true
    add_index :workspace_memberships, :role
    add_index :workspace_memberships, :status
    add_index :workspace_memberships, :joined_at
  end
end 
