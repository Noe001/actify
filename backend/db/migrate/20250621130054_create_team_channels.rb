class CreateTeamChannels < ActiveRecord::Migration[7.2]
  def change
    create_table :team_channels, id: :string do |t|
      t.references :team, null: false, foreign_key: true, type: :string
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :string
      t.string :name, null: false
      t.text :description
      t.string :channel_type, default: 'public', null: false # public, private, direct
      t.boolean :is_archived, default: false
      t.json :settings
      t.datetime :last_message_at
      t.integer :message_count, default: 0

      t.timestamps
    end

    add_index :team_channels, [:team_id, :name], unique: true
    add_index :team_channels, :channel_type
    add_index :team_channels, :last_message_at
  end
end 
 