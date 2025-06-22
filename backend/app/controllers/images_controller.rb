class ImagesController < ApplicationController
  def show
    filename = params[:filename]
    
    # 安全対策：ファイル名にディレクトリトラバーサル攻撃を防止
    if filename.include?('../') || filename.include?('..\\')
      return render plain: 'Invalid filename', status: :bad_request
    end
    
    # SVGとPNGの両方に対応
    svg_path = Rails.root.join('public', 'images', filename.gsub(/\.png$/, '.svg'))
    
    # SVGファイルが存在するか確認
    if File.exist?(svg_path)
      send_file svg_path, type: 'image/svg+xml', disposition: 'inline'
    else
      # 通常のファイルとして提供
      file_path = Rails.root.join('public', 'images', filename)
      if File.exist?(file_path)
        send_file file_path, disposition: 'inline'
      else
        # ファイルが見つからない場合は404エラー
        render plain: 'File not found', status: :not_found
      end
    end
  end
end 
