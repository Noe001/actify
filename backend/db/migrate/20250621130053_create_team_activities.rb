class CreateTeamActivities < ActiveRecord::Migration[7.2]
  def change
    create_table :team_activities, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :user, null: false, foreign_key: true, type: :string
      t.string :activity_type, null: false
      t.string :title, null: false
      t.text :description
      t.json :metadata
      t.references :target, polymorphic: true, type: :string, null: true
      t.boolean :is_read, default: false
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :team_activities, [:team_id, :occurred_at]
    add_index :team_activities, [:user_id, :occurred_at]
    add_index :team_activities, :activity_type
    add_index :team_activities, [:target_type, :target_id]
  end
end 
 