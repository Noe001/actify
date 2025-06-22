class CreateTeamGoals < ActiveRecord::Migration[7.2]
  def change
    create_table :team_goals, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :string
      t.string :title, null: false
      t.text :description
      t.string :goal_type, default: 'objective', null: false # objective, kpi, milestone
      t.string :category, null: false # performance, growth, quality, innovation
      t.string :priority, default: 'medium', null: false # low, medium, high, critical
      t.string :status, default: 'planning', null: false # planning, active, completed, cancelled, paused
      
      # KPI用フィールド
      t.decimal :target_value, precision: 10, scale: 2, null: true
      t.decimal :current_value, precision: 10, scale: 2, default: 0
      t.string :unit, null: true # %, 個, 人, 円, etc.
      t.string :measurement_method, null: true # how to measure
      
      # 期間設定
      t.date :start_date, null: false
      t.date :target_date, null: false
      t.date :completed_date, null: true
      
      # 進捗管理
      t.integer :progress_percentage, default: 0
      t.text :progress_notes
      t.datetime :last_updated_at
      t.references :last_updated_by, null: true, foreign_key: { to_table: :users }, type: :string
      
      # メタデータ
      t.json :metadata
      t.boolean :is_archived, default: false
      t.text :tags # カンマ区切り

      t.timestamps
    end

    add_index :team_goals, [:team_id, :status]
    add_index :team_goals, [:team_id, :goal_type]
    add_index :team_goals, [:team_id, :category]
    add_index :team_goals, [:team_id, :priority]
    add_index :team_goals, :target_date
    add_index :team_goals, :progress_percentage
    add_index :team_goals, :is_archived
  end
end 
 