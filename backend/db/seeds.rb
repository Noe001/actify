# テスト用ワークスペースの作成
test_workspace = Workspace.find_or_create_by!(subdomain: 'test-company') do |workspace|
  workspace.name = 'テスト株式会社'
  workspace.description = 'テスト用の企業です'
  workspace.status = 'active'
  workspace.is_public = true
  workspace.primary_color = '#3B82F6'
  workspace.accent_color = '#10B981'
end

# デフォルトユーザーの作成
admin_user = User.find_or_create_by!(email: 'admin@example.com') do |user|
  user.name = 'Admin'
  user.role = 'admin'
  user.department = 'dev'
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.current_workspace = test_workspace
end

# 追加のテストユーザー作成
sales_user = User.find_or_create_by!(email: 'sales@example.com') do |user|
  user.name = '営業太郎'
  user.role = 'user'
  user.department = 'sales'
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.current_workspace = test_workspace
end

dev_user = User.find_or_create_by!(email: 'dev@example.com') do |user|
  user.name = '開発花子'
  user.role = 'user'
  user.department = 'dev'
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.current_workspace = test_workspace
end

# ワークスペースメンバーシップの作成
test_workspace.add_admin(admin_user) unless test_workspace.admin?(admin_user)
test_workspace.add_member(sales_user, 'member') unless test_workspace.member?(sales_user)
test_workspace.add_member(dev_user, 'member') unless test_workspace.member?(dev_user)

# テスト用マニュアルデータの作成
manual1 = Manual.find_or_create_by!(title: '新入社員向けオリエンテーション') do |manual|
  manual.content = '新入社員向けの基本的な情報と手続きについて説明します。\n\n1. 会社概要\n2. チーム構造\n3. 基本的な業務プロセス\n4. 行動規範\n5. 福利厚生'
  manual.user = admin_user
  manual.workspace = test_workspace
  manual.department = 'hr'
  manual.category = 'procedure'
  manual.access_level = 'all'
  manual.edit_permission = 'author'
  manual.status = 'published'
  manual.tags = '新入社員,オリエンテーション,入門'
end

manual2 = Manual.find_or_create_by!(title: '営業プロセスガイド') do |manual|
  manual.content = '見込み客の獲得から契約までの標準的な営業フローを説明します。\n\n1. 見込み客リサーチ\n2. 初回アプローチ\n3. 提案資料作成\n4. 価格交渉\n5. クロージング'
  manual.user = sales_user
  manual.workspace = test_workspace
  manual.department = 'sales'
  manual.category = 'procedure'
  manual.access_level = 'department'
  manual.edit_permission = 'author'
  manual.status = 'published'
  manual.tags = '営業,プロセス,顧客'
end

manual3 = Manual.find_or_create_by!(title: 'システム開発手順') do |manual|
  manual.content = 'システム開発における標準的な手順とベストプラクティスについて説明します。\n\n1. 要件定義\n2. 設計\n3. 実装\n4. テスト\n5. デプロイ'
  manual.user = dev_user
  manual.workspace = test_workspace
  manual.department = 'dev'
  manual.category = 'system'
  manual.access_level = 'department'
  manual.edit_permission = 'author'
  manual.status = 'published'
  manual.tags = '開発,システム,手順'
end

manual4 = Manual.find_or_create_by!(title: 'カスタマーサポート対応マニュアル') do |manual|
  manual.content = 'お客様からの問い合わせに対する標準的な対応手順を説明します。\n\n1. 初期対応\n2. 事実確認\n3. 謝罪と解決策提示\n4. フォローアップ\n5. 再発防止策'
  manual.user = admin_user
  manual.workspace = test_workspace
  manual.department = 'sales'
  manual.category = 'procedure'
  manual.access_level = 'all'
  manual.edit_permission = 'department'
  manual.status = 'published'
  manual.tags = 'サポート,顧客対応,手順,トラブルシューティング'
end

manual5 = Manual.find_or_create_by!(title: '下書きマニュアル') do |manual|
  manual.content = 'これは下書きのマニュアルです。まだ作成中です。'
  manual.user = dev_user
  manual.workspace = test_workspace
  manual.department = 'dev'
  manual.category = 'procedure'
  manual.access_level = 'all'
  manual.edit_permission = 'author'
  manual.status = 'draft'
  manual.tags = 'テスト,下書き'
end

puts "シードデータの作成が完了しました："
puts "- ワークスペース: #{Workspace.count}件"
puts "- ユーザー: #{User.count}人"
puts "- ワークスペースメンバーシップ: #{WorkspaceMembership.count}件"
puts "- マニュアル: #{Manual.count}件"
puts "  - 公開済み: #{Manual.published.count}件"
puts "  - 下書き: #{Manual.where(status: 'draft').count}件"
