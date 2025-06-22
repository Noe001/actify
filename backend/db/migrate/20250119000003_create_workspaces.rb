class CreateWorkspaces < ActiveRecord::Migration[7.2]
  def change
    create_table :workspaces, id: :string do |t|
      t.string :name, null: false
      t.text :description
      t.string :subdomain, null: false
      t.string :invite_code
      t.string :status, default: 'active'
      t.boolean :is_public, default: false
      t.string :primary_color, default: '#3B82F6'
      t.string :accent_color, default: '#10B981'
      t.string :logo_url
      t.json :settings
      t.datetime :archived_at
      t.timestamps
    end

    add_index :workspaces, :subdomain, unique: true
    add_index :workspaces, :invite_code, unique: true
    add_index :workspaces, :status
  end
end 
