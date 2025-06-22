class CreateTeamAutomations < ActiveRecord::Migration[7.2]
  def change
    create_table :team_automations, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :string
      
      t.string :name, null: false
      t.text :description
      t.string :automation_type, null: false # trigger, scheduled, manual
      t.string :status, default: 'active', null: false # active, paused, draft
      
      # トリガー設定
      t.json :trigger_config
      
      # 条件設定
      t.json :conditions
      
      # アクション設定
      t.json :actions
      
      # スケジュール設定（scheduled type用）
      t.string :schedule_type, null: true # daily, weekly, monthly, custom
      t.json :schedule_config
      t.datetime :last_run_at
      t.datetime :next_run_at
      
      # 実行統計
      t.integer :run_count, default: 0
      t.integer :success_count, default: 0
      t.integer :error_count, default: 0
      t.datetime :last_success_at
      t.datetime :last_error_at
      t.text :last_error_message
      
      # 設定
      t.boolean :is_enabled, default: true
      t.integer :max_retries, default: 3
      t.integer :timeout_seconds, default: 300

      t.timestamps
    end

    add_index :team_automations, [:team_id, :status]
    add_index :team_automations, [:team_id, :automation_type]
    add_index :team_automations, :is_enabled
    add_index :team_automations, :next_run_at

  end
end 
 