class CreateTeams < ActiveRecord::Migration[7.2]
  def change
    create_table :teams, id: :string do |t|
      t.string :name, null: false
      t.text :description
      t.references :workspace, null: false, foreign_key: { to_table: :workspaces }, type: :string
      t.string :color, default: '#3B82F6'
      t.string :status, default: 'active'
      t.string :leader_id
      t.integer :member_count, default: 0

      t.timestamps
    end

    add_index :teams, :status

    add_foreign_key :teams, :users, column: :leader_id, primary_key: :id
  end
end
