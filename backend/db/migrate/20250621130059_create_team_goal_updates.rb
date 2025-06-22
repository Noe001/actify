class CreateTeamGoalUpdates < ActiveRecord::Migration[7.2]
  def change
    create_table :team_goal_updates, id: :string do |t|
      t.references :team_goal, null: false, foreign_key: true, type: :string
      t.references :updated_by, null: false, foreign_key: { to_table: :users }, type: :string
      t.string :update_type, null: false # progress, status, target, notes
      t.decimal :old_value, precision: 10, scale: 2, null: true
      t.decimal :new_value, precision: 10, scale: 2, null: true
      t.string :old_status, null: true
      t.string :new_status, null: true
      t.text :notes
      t.json :changes # 変更されたフィールドの詳細

      t.timestamps
    end

    add_index :team_goal_updates, [:team_goal_id, :created_at]
    add_index :team_goal_updates, :update_type
  end
end 
 