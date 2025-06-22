class AddWorkspaceToExistingTablesNew < ActiveRecord::Migration[7.2]
  def change
    # Tasksテーブルにworkspace_idを追加
    add_reference :tasks, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string

    # Meetingsテーブルにworkspace_idを追加
    add_reference :meetings, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string

    # Manualsテーブルにworkspace_idを追加
    add_reference :manuals, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string

    # Attendancesテーブルにworkspace_idを追加
    add_reference :attendances, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string

    # Leave_requestsテーブルにworkspace_idを追加
    add_reference :leave_requests, :workspace, null: true, foreign_key: { to_table: :workspaces }, type: :string
  end
end
