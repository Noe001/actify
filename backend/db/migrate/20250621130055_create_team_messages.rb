class CreateTeamMessages < ActiveRecord::Migration[7.2]
  def change
    create_table :team_messages, id: :string do |t|
      t.references :team_channel, null: false, foreign_key: true, type: :string
      t.references :user, null: false, foreign_key: true, type: :string
      t.text :content, null: false
      t.string :message_type, default: 'text', null: false # text, file, image, system
      t.json :metadata
      t.references :parent_message, null: true, foreign_key: { to_table: :team_messages }, type: :string
      t.boolean :is_edited, default: false
      t.datetime :edited_at
      t.boolean :is_deleted, default: false
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :team_messages, [:team_channel_id, :created_at]
    add_index :team_messages, :message_type
  end
end 
 