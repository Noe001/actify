# ActiveStorageのファイルを修復するスクリプト
# 使用方法: rails runner fix-storage.rb

require 'fileutils'

# サンプル画像を読み込む
sample_image_path = Rails.root.join('public', 'images', 'no-image-available.png')
if File.exist?(sample_image_path)
  sample_image = File.binread(sample_image_path)
  puts "サンプル画像のサイズ: #{sample_image.size} bytes"
else
  puts "エラー: サンプル画像が見つかりません: #{sample_image_path}"
  exit 1
end

# すべてのActiveStorage::Blobを処理
ActiveStorage::Blob.find_each do |blob|
  # ディスク上のパスを取得
  path = ActiveStorage::Blob.service.send(:path_for, blob.key)
  
  # ディレクトリが存在するか確認し、なければ作成
  dir = File.dirname(path)
  FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
  
  # ファイルが存在しないか空の場合、サンプル画像で上書き
  if !File.exist?(path) || File.size(path) == 0
    puts "修復中: ID:#{blob.id} #{blob.filename} (#{path})"
    puts "  オリジナルファイルは: #{blob.service_name}サービスの#{blob.key}キーで、サイズ#{blob.byte_size}bytes"
    File.binwrite(path, sample_image)
    puts "  ✅ 修復完了"
  else
    puts "スキップ: ID:#{blob.id} #{blob.filename} - 正常なファイル"
  end
end

puts "処理完了: #{ActiveStorage::Blob.count} 件のファイルを確認しました" 
