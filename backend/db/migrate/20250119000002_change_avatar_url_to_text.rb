class ChangeAvatarUrlToText < ActiveRecord::Migration[7.2]
  def change
    change_column :users, :avatarUrl, :text
  end
end 
