class CreateTeamHealthMetrics < ActiveRecord::Migration[7.2]
  def change
    create_table :team_health_metrics, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.date :measured_date, null: false
      
      # 基本メトリクス
      t.decimal :overall_health_score, precision: 4, scale: 2, default: 0
      t.decimal :engagement_score, precision: 4, scale: 2, default: 0
      t.decimal :collaboration_score, precision: 4, scale: 2, default: 0
      t.decimal :productivity_score, precision: 4, scale: 2, default: 0
      t.decimal :satisfaction_score, precision: 4, scale: 2, default: 0
      
      # 活動メトリクス
      t.integer :total_messages, default: 0
      t.integer :active_users, default: 0
      t.integer :tasks_completed, default: 0
      t.integer :goals_achieved, default: 0
      t.integer :recognitions_given, default: 0
      
      # 参加・エンゲージメント
      t.decimal :participation_rate, precision: 5, scale: 2, default: 0
      t.decimal :response_rate, precision: 5, scale: 2, default: 0
      t.decimal :retention_rate, precision: 5, scale: 2, default: 0
      
      # 効率・品質メトリクス
      t.decimal :task_completion_rate, precision: 5, scale: 2, default: 0
      t.decimal :on_time_delivery_rate, precision: 5, scale: 2, default: 0
      t.decimal :quality_score, precision: 4, scale: 2, default: 0
      
      # ストレス・燃え尽き指標
      t.decimal :stress_level, precision: 4, scale: 2, default: 0
      t.decimal :workload_balance, precision: 4, scale: 2, default: 0
      t.decimal :burnout_risk, precision: 4, scale: 2, default: 0
      
      # 成長・学習
      t.decimal :learning_rate, precision: 4, scale: 2, default: 0
      t.decimal :skill_development, precision: 4, scale: 2, default: 0
      
      # 生データ（JSON形式）
      t.json :raw_data
      
      # 計算メタデータ
      t.json :calculation_metadata
      t.datetime :calculated_at

      t.timestamps
    end

    add_index :team_health_metrics, [:team_id, :measured_date], unique: true
    add_index :team_health_metrics, :measured_date
    add_index :team_health_metrics, :overall_health_score
    add_index :team_health_metrics, :engagement_score
    add_index :team_health_metrics, :calculated_at
  end
end 
 