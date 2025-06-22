class CreateTeamMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :team_memberships do |t|
      t.references :team, null: false, foreign_key: { to_table: :teams }, type: :string
      t.references :user, null: false, foreign_key: { to_table: :users }, type: :string
      t.string :role, default: 'member'
      t.string :status, default: 'active'
      t.datetime :joined_at
      t.datetime :left_at
      t.timestamps
    end

    add_index :team_memberships, [:team_id, :user_id], unique: true
    add_index :team_memberships, :role
    add_index :team_memberships, :status
  end
end
