class AddCurrentWorkspaceToUsers < ActiveRecord::Migration[7.2]
  def change
    add_reference :users, :current_workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :users, :current_workspace_id
  end
end 
