class AddWorkspaceToExistingTables < ActiveRecord::Migration[7.2]
  def change
    # Tasksテーブルにworkspace_idを追加
    add_reference :tasks, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :tasks, :workspace_id

    # Meetingsテーブルにworkspace_idを追加
    add_reference :meetings, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :meetings, :workspace_id

    # Manualsテーブルにworkspace_idを追加
    add_reference :manuals, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :manuals, :workspace_id

    # Attendancesテーブルにworkspace_idを追加
    add_reference :attendances, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :attendances, :workspace_id

    # Leave_requestsテーブルにworkspace_idを追加
    add_reference :leave_requests, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
    add_index :leave_requests, :workspace_id
  end
end 
