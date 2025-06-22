class CreateTeamPermissions < ActiveRecord::Migration[7.2]
  def change
    create_table :team_permissions, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :user, null: true, foreign_key: true, type: :string # nullの場合はロールベース
      t.string :role, null: true # admin, manager, member, guest
      t.string :resource_type, null: false # task, channel, meeting, file, etc.
      t.string :resource_id, null: true, type: :string # 特定リソースの場合
      t.string :action, null: false # create, read, update, delete, manage
      t.boolean :granted, default: true, null: false
      t.text :conditions, null: true # JSON形式の条件
      t.datetime :expires_at, null: true
      t.references :granted_by, null: false, foreign_key: { to_table: :users }, type: :string

      t.timestamps
    end

    add_index :team_permissions, [:team_id, :user_id]
    add_index :team_permissions, [:team_id, :role]
    add_index :team_permissions, [:resource_type, :action]
    add_index :team_permissions, :expires_at
    add_index :team_permissions, :granted
  end
end 
 