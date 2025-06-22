# ActiveStorageのリンク問題を解決するスクリプト
# 使用方法: rails runner resolve-links.rb

require 'json'
require 'base64'

include Rails.application.routes.url_helpers

puts "ActiveStorage BLOBの調査と修正を開始します"
puts "----------------------------------------"

# 古いsigned_idを分析
old_signed_id = "eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCZz09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--5a17736d0dbe12236f019e4c27fdc5d2f1e2c04c"
puts "問題のあるsigned_id: #{old_signed_id}"

# signed_idを分割してデコード
payload, signature = old_signed_id.split('--')
decoded_payload = Base64.urlsafe_decode64(payload)

puts "デコードされたペイロード: #{decoded_payload}"
begin
  payload_hash = JSON.parse(decoded_payload)
  puts "JSONパース結果: #{payload_hash.inspect}"
  
  if payload_hash["_rails"] && payload_hash["_rails"]["message"]
    encoded_blob_id = payload_hash["_rails"]["message"]
    puts "エンコードされたblob_id: #{encoded_blob_id}"
    
    blob_id_raw = Base64.decode64(encoded_blob_id)
    puts "デコードされたblob_id (raw): #{blob_id_raw.unpack('H*').first}"
    
    # Marshallで直接デコード試行
    begin
      blob_id = Marshal.load(blob_id_raw)
      puts "Marshallデコード結果: #{blob_id}"
    rescue => e
      puts "Marshallデコードエラー: #{e.message}"
    end
  end
rescue => e
  puts "JSONパースエラー: #{e.message}"
end

# すべてのBlobを調査
puts "\nすべてのBlobを調査します:"
puts "------------------------"
ActiveStorage::Blob.find_each do |blob|
  puts "ID: #{blob.id}"
  puts "  Key: #{blob.key}"
  puts "  Filename: #{blob.filename}"
  puts "  現在のsigned_id: #{blob.signed_id}"
  puts ""
  
  # ディスク上のファイルを確認
  begin
    path = ActiveStorage::Blob.service.send(:path_for, blob.key)
    disk_status = File.exist?(path) ? "存在 (#{File.size(path)} bytes)" : "存在しない"
    puts "  ディスク上のファイル: #{disk_status}"
    puts "  パス: #{path}"
    
    # クローンIDを確認 (テスト)
    test_blob_id = blob.id
    test_encoded = [Marshal.dump(test_blob_id)].pack('m')
    puts "  テストID #{test_blob_id} のBase64エンコード: #{test_encoded}"
  rescue => e
    puts "  ディスク確認エラー: #{e.message}"
  end
  puts "------------------------"
end

# 問題解決のために直接リンクを提供
puts "\n解決策:"
puts "------------------------"
puts "フロントエンドのコードで以下のような形式のURLを使用してください:"
puts 'http://localhost:3000/rails/active_storage/blobs/proxy/[BLOB-SIGNED-ID]/[FILENAME]'
puts ""
puts "各ファイルの正しいsigned_idは以下の通りです:"

ActiveStorage::Blob.find_each do |blob|
  filename = blob.filename.to_s
  signed_id = blob.signed_id
  proxy_url = rails_blob_path(blob, disposition: "inline")
  puts "ID: #{blob.id} (#{filename})"
  puts "  signed_id: #{signed_id}"
  puts "  正しいURL: http://localhost:3000#{proxy_url}"
  puts ""
end

puts "\n修正完了: フロントエンドでURL参照を更新してください" 
