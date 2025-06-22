class CreateTeamRecognitions < ActiveRecord::Migration[7.2]
  def change
    create_table :team_recognitions, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :recipient, null: false, foreign_key: { to_table: :users }, type: :string
      t.references :given_by, null: false, foreign_key: { to_table: :users }, type: :string
      
      t.string :recognition_type, null: false # praise, achievement, milestone, collaboration
      t.string :category, null: false # performance, teamwork, innovation, leadership
      t.string :title, null: false
      t.text :message
      
      # バッジ・アイコン設定
      t.string :badge_name
      t.string :badge_color, default: '#3B82F6'
      t.string :badge_icon
      
      # ポイント・レベルシステム
      t.integer :points_awarded, default: 0
      t.string :achievement_level # bronze, silver, gold, platinum
      
      # 可視性設定
      t.boolean :is_public, default: true
      t.boolean :is_featured, default: false
      
      # 関連リソース
      t.string :related_resource_type, null: true # task, goal, meeting
      t.string :related_resource_id, null: true, type: :string

      t.timestamps
    end

    add_index :team_recognitions, [:team_id, :recipient_id]
    add_index :team_recognitions, [:team_id, :recognition_type]
    add_index :team_recognitions, [:team_id, :category]
    add_index :team_recognitions, :is_public
    add_index :team_recognitions, :is_featured
    add_index :team_recognitions, :created_at
  end
end 
 