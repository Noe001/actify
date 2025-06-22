import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// Markdown-itのインスタンスを設定
const md = new MarkdownIt({
  html: true,        // HTMLタグを有効化（ただし後でサニタイズが必要）
  linkify: true,     // URLを自動的にリンクに変換
  typographer: true, // 引用符やダッシュの美しい置換
  breaks: true,      // 改行を<br>に変換
});

/**
 * MarkdownテキストをHTMLに変換し、サニタイズする
 */
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  
  try {
    const html = md.render(markdown);
    // DOMPurifyを使用してXSS攻撃を防ぐためにHTMLをサニタイズ
    return DOMPurify.sanitize(html, {
      // 許可するタグを指定
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'div', 'span'
      ],
      // 許可する属性を指定
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src',
        'class', 'id',
        'target', 'rel'
      ],
      // リンクのプロトコルを制限
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return markdown; // エラーの場合は元のテキストを返す
  }
};

/**
 * Markdownテキストからプレーンテキストへの概要を生成
 */
export const getMarkdownPreview = (markdown: string, maxLength: number = 150): string => {
  if (!markdown) return '';
  
  try {
    // HTMLタグを除去してプレーンテキストに変換
    const html = md.render(markdown);
    // サニタイズしてからHTMLタグを除去
    const sanitizedHtml = DOMPurify.sanitize(html);
    const text = sanitizedHtml.replace(/<[^>]*>/g, '');
    
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  } catch (error) {
    console.error('Markdown preview error:', error);
    return markdown.substring(0, maxLength) + '...';
  }
};

export default md; 
