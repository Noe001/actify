class CreateTeamTemplates < ActiveRecord::Migration[7.2]
  def change
    create_table :team_templates, id: :string do |t|
      t.string :name, null: false
      t.text :description
      t.string :category, null: false # development, marketing, hr, finance, general
      t.string :template_type, default: 'public', null: false # public, private, workspace
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :string
      t.references :workspace, null: true, foreign_key: true, type: :string # privateの場合
      
      # チーム設定のテンプレート
      t.json :team_settings
      
      # デフォルトロール・権限設定
      t.json :default_roles
      t.json :default_permissions
      
      # デフォルトチャンネル設定
      t.json :default_channels
      
      # デフォルト目標・KPI設定
      t.json :default_goals
      
      # カスタムフィールド設定
      t.json :custom_fields
      
      # ワークフロー設定
      t.json :workflows
      
      # 統計・使用回数
      t.integer :usage_count, default: 0
      t.decimal :rating, precision: 3, scale: 2, default: 0
      t.integer :rating_count, default: 0
      
      # メタデータ
      t.text :tags # カンマ区切り
      t.boolean :is_featured, default: false
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :team_templates, :category
    add_index :team_templates, :template_type
    add_index :team_templates, [:workspace_id, :template_type]
    add_index :team_templates, :is_featured
    add_index :team_templates, :usage_count
    add_index :team_templates, :rating
  end
end 
 