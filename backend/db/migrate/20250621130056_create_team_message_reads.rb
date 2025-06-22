class CreateTeamMessageReads < ActiveRecord::Migration[7.2]
  def change
    create_table :team_message_reads, id: :string do |t|
      t.references :team_message, null: false, foreign_key: true, type: :string
      t.references :user, null: false, foreign_key: true, type: :string
      t.datetime :read_at, null: false

      t.timestamps
    end

    add_index :team_message_reads, [:user_id, :team_message_id], unique: true
    add_index :team_message_reads, :read_at
  end
end 
