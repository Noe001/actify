class AddProfileFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :avatarUrl, :string
    add_column :users, :department, :string
    add_column :users, :position, :string
    add_column :users, :bio, :text
  end
end 
