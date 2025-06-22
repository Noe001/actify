import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileSearch, FileText, Building2, FolderOpen, Plus, Search, RotateCcw, Edit, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SortAsc } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Manual } from '@/types/api';
import manualService, { ManualListParams } from '@/services/manualService';
import { renderMarkdown, getMarkdownPreview } from '@/utils/markdown';

import { 
  DEPARTMENTS, 
  CATEGORIES, 
  FILTER_OPTIONS, 
  getDepartmentLabel, 
  getCategoryLabel,
  getStatusBadgeVariant 
} from '@/constants/manual';

// 並び替えオプション
const SORT_OPTIONS = [
  { value: 'updated_at_desc', label: '更新日時（新しい順）' },
  { value: 'updated_at_asc', label: '更新日時（古い順）' },
  { value: 'created_at_desc', label: '作成日時（新しい順）' },
  { value: 'created_at_asc', label: '作成日時（古い順）' },
  { value: 'title_asc', label: 'タイトル（昇順）' },
  { value: 'title_desc', label: 'タイトル（降順）' },
];

const ManualView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('published');
  const [selectedSort, setSelectedSort] = useState('updated_at_desc');
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<Manual | null>(null);
  const [isMetaVisible, setIsMetaVisible] = useState(true);
  


  // 初期化時にURLパラメータからフィルター条件を読み取る
  useEffect(() => {
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const category = searchParams.get('category');
    
    if (status) {
      setSelectedFilter(status);
    }
    if (department) {
      setSelectedDepartment(department);
    }
    if (category) {
      setSelectedCategory(category);
    }
    
    loadManuals({ page: 1 });
  }, [searchParams]);

  // フィルター・並び替え変更時の処理（検索クエリは手動実行のため除外）
  useEffect(() => {
    setCurrentPage(1);
    loadManuals({ page: 1 });
  }, [selectedFilter, selectedDepartment, selectedCategory, selectedSort]);



  // ページ変更ハンドラー（React-Paginate用）
  const handlePageChange = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1; // React-Paginateは0ベースなので+1
    
    // ページが実際に変わった場合のみ処理
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      
      // 現在のフィルター条件を含めてリクエスト
      const sortParams = parseSortOption(selectedSort);
      const params: ManualListParams = {
        page: newPage,
        per_page: 10,
        query: searchQuery || undefined,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        order_by: sortParams.order_by,
        order: sortParams.order,
      };
      
      // ステータスフィルターを明示的に指定（'my'フィルターは除く）
      if (selectedFilter !== 'my') {
        params.status = selectedFilter; // 'all', 'published', 'draft' のいずれかを必ず指定
      }
      
      loadManuals(params);
    }
  };

  // マニュアル一覧の読み込み（ページネーション対応）
  const loadManuals = async (params?: ManualListParams) => {
    setLoading(true);

    try {
      // ページネーションパラメータを確実に設定
      const pageToLoad = params?.page ?? currentPage;
      const sortParams = parseSortOption(selectedSort);
      const loadParams: ManualListParams = {
        page: pageToLoad,
        per_page: 10, // 1ページあたり10件に制限
        query: searchQuery || undefined,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        order_by: sortParams.order_by,
        order: sortParams.order,
        ...params, // 追加パラメータで上書き可能
      };



      let response;
      
      if (selectedFilter === 'my') {
        // 自分のマニュアルを取得（statusパラメータを除外）
        const myManualsParams = { ...loadParams };
        delete myManualsParams.status; // 自分のマニュアル取得時はステータスフィルターを除外
        response = await manualService.getMyManuals(myManualsParams);
      } else {
        // 検索クエリがある場合は検索APIを使用、ない場合は一覧APIを使用
        loadParams.status = selectedFilter; // 'all', 'published', 'draft' のいずれかを必ず指定
        
        if (searchQuery && searchQuery.trim().length > 0) {
          // 検索機能を使用
          const searchParams = {
            ...loadParams,
            query: searchQuery.trim(), // searchAPIで使用するqueryパラメーター
          };
          response = await manualService.searchManuals(searchParams);
        } else {
          // 通常の一覧取得
          response = await manualService.getManuals(loadParams);
        }
      }

      // 統一されたレスポンス形式を処理
      if (response.success && response.data) {
        setManuals(response.data.data || []);
        setTotalPages(response.data.meta?.total_pages || 1);
        setTotalCount(response.data.meta?.total_count || 0);
      } else {
        setManuals([]);
        setTotalPages(1);
        setTotalCount(0);
        if (!response.success && response.message) {
          toast.error(response.message);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // マニュアル削除
  const handleDelete = async (manual: Manual) => {
    try {
      await manualService.deleteManual(manual.id);
      toast.success('マニュアルを削除しました');
      setIsDeleteDialogOpen(false);
      setSelectedManual(null); // 詳細ポップアップも閉じる
      loadManuals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // 検索実行
  const handleSearch = () => {
    setCurrentPage(1);
    loadManuals({ page: 1 }); // loadManuals内で適切なAPIエンドポイントが選択される
  };

  // フィルターリセット
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setSelectedCategory('all');
    setSelectedFilter('published');
    setSelectedSort('updated_at_desc');
    setCurrentPage(1);
    
    // リセット後のパラメータで再検索
    const resetParams: ManualListParams = {
      page: 1,
      per_page: 10,
      order_by: 'updated_at',
      order: 'desc',
      status: 'published', // デフォルトは公開済みのみ
    };
    
    loadManuals(resetParams);
  };

  // 検索入力の処理
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
  };

  // 並び替えパラメータの解析
  const parseSortOption = (sortValue: string): { order_by: string; order: 'asc' | 'desc' } => {
    const isAsc = sortValue.endsWith('_asc');
    
    let actualColumn: string;
    if (sortValue.startsWith('title_')) {
      actualColumn = 'title';
    } else if (sortValue.startsWith('created_at_')) {
      actualColumn = 'created_at';  
    } else {
      actualColumn = 'updated_at'; // デフォルト
    }
    
    return {
      order_by: actualColumn,
      order: isAsc ? 'asc' : 'desc'
    };
  };

  // ラベル変換関数


  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">業務マニュアル</h1>
              <p className="text-muted-foreground">チームの業務マニュアルを管理します</p>
            </div>
            <Button onClick={() => navigate('/manual/create')}>
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <Label>表示条件</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="表示条件を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>部門</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>カテゴリー</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">キーワード検索</Label>
                <Input
                  id="search"
                  placeholder="タイトルで検索..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <SortAsc className="h-4 w-4" />
                  並び替え
                </Label>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger>
                    <SelectValue placeholder="並び替えを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* マニュアル一覧 */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : manuals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedDepartment !== 'all' || selectedCategory !== 'all' || selectedFilter !== 'all'
                    ? '検索条件に一致するマニュアルが見つかりませんでした'
                    : 'マニュアルが見つかりませんでした'
                  }
                </p>
                {(searchQuery || selectedDepartment !== 'all' || selectedCategory !== 'all') && (
                  <Button variant="outline" onClick={handleResetFilters} className="mr-2">
                    フィルターをリセット
                  </Button>
                )}
                {selectedFilter === 'my' && (
                  <Button onClick={() => navigate('/manual/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    最初のマニュアルを作成
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            manuals.map((manual) => (
              <Card key={manual.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                setSelectedManual(manual);
                setIsMetaVisible(true);
              }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{manual.title}</h3>
                        <Badge variant={getStatusBadgeVariant(manual.status)}>
                          {manual.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span>
                          <Building2 className="h-4 w-4 inline mr-1" />
                          {getDepartmentLabel(manual.department)}
                        </span>
                        <span>
                          <FolderOpen className="h-4 w-4 inline mr-1" />
                          {getCategoryLabel(manual.category)}
                        </span>
                        {manual.author && (
                          <span>作成者: {manual.author.name}</span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getMarkdownPreview(manual.content || '', 150)}
                      </p>

                      {manual.tags && (
                        <div className="mt-3">
                          {manual.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="mr-1">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>


                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 検索結果の情報表示 */}
        <div className="flex justify-between items-center mt-6 mb-4">
          <div className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                {((currentPage - 1) * 10) + 1}〜{Math.min(currentPage * 10, totalCount)}件 / 全{totalCount}件
              </>
            ) : (
              '検索結果がありません'
            )}
          </div>
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              ページ {currentPage} / {totalPages}
            </div>
          )}
        </div>

        {/* React-Paginateを使用したページネーション */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              {/* 前のページボタン */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => currentPage > 1 && handlePageChange({ selected: currentPage - 2 })}
                className="px-3 py-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* React-Paginate */}
              <ReactPaginate
                pageCount={totalPages}
                pageRangeDisplayed={5}
                marginPagesDisplayed={2}
                onPageChange={handlePageChange}
                forcePage={currentPage - 1} // React-Paginateは0ベースなので-1
                previousLabel={null} // カスタムボタンを使用するため無効化
                nextLabel={null} // カスタムボタンを使用するため無効化
                breakLabel="..."
                containerClassName="flex items-center space-x-1"
                pageLinkClassName="px-3 py-2 text-sm border border-border bg-background hover:bg-muted text-foreground rounded-md transition-colors duration-200"
                activeLinkClassName="!bg-primary !text-primary-foreground !border-primary"
                breakLinkClassName="px-3 py-2 text-sm text-gray-500"
                disabledClassName="opacity-50 cursor-not-allowed"
              />
              
              {/* 次のページボタン */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => currentPage < totalPages && handlePageChange({ selected: currentPage })}
                className="px-3 py-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* マニュアル詳細表示ダイアログ */}
        <Dialog open={!!selectedManual} onOpenChange={() => setSelectedManual(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
            {selectedManual && (
              <>
                {/* ヘッダー部分 */}
                <div className="bg-muted/30 p-6 border-b flex-shrink-0">
                  <DialogHeader className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <DialogTitle 
                        className="text-3xl font-bold text-foreground leading-tight"
                      >
                        {selectedManual.title}
                      </DialogTitle>
                      {selectedManual.created_at && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(selectedManual.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                    
                    <DialogDescription className="sr-only">
                      {selectedManual.title}のマニュアル詳細を表示しています。
                    </DialogDescription>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={getStatusBadgeVariant(selectedManual.status)}
                          className="text-xs font-medium px-3 py-1 flex-shrink-0"
                        >
                          {selectedManual.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mr-12">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/manual/edit/${selectedManual.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManualToDelete(selectedManual);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          削除
                        </Button>
                      </div>
                    </div>
                    
                    {/* メタ情報トグルボタン（モバイルのみ表示） */}
                    <div className="md:hidden mt-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                        onClick={() => setIsMetaVisible(!isMetaVisible)}
                      >
                        <span className="text-sm text-muted-foreground">詳細情報</span>
                        {isMetaVisible ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    {/* メタ情報グリッド */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 transition-all duration-300 overflow-hidden ${
                      isMetaVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
                    }`}>
                      <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                        <div className="bg-primary/5 p-2 rounded-full">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-medium">部門</div>
                          <div className="text-sm font-semibold text-foreground">
                            {getDepartmentLabel(selectedManual.department)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                        <div className="bg-secondary/60 p-2 rounded-full">
                          <FolderOpen className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-medium">カテゴリー</div>
                          <div className="text-sm font-semibold text-foreground">
                            {getCategoryLabel(selectedManual.category)}
                          </div>
                        </div>
                      </div>
                      
                      {selectedManual.author && (
                        <div className="flex items-center space-x-2 bg-card/60 rounded-lg p-3 border">
                          <div className="bg-accent/60 p-2 rounded-full">
                            <FileText className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground font-medium">作成者</div>
                            <div className="text-sm font-semibold text-foreground">
                              {selectedManual.author.name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* タグ表示 */}
                    {selectedManual.tags && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedManual.tags.split(',').map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="bg-background/80 text-foreground border"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </DialogHeader>
                </div>

                {/* コンテンツ部分 */}
                <div className="flex-1 overflow-y-auto p-6 bg-background min-h-0">
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground [&_h1]:text-[1.75rem] [&_h2]:text-2xl [&_h3]:text-xl [&_h4]:text-base [&_p]:my-0.5 [&_h1]:mb-1 [&_h2]:mb-1 [&_h2]:mt-0.5 [&_h3]:mb-0.5 [&_h4]:mb-0.5 [&_h5]:mb-0.5 [&_h6]:mb-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_blockquote]:my-1 [&_h1]:border-b [&_h1]:border-gray-300 [&_h1]:pb-1">
                    {selectedManual.content ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: renderMarkdown(selectedManual.content) 
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground italic">
                            内容がありません
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent aria-describedby="delete-dialog-description">
            <DialogHeader>
              <DialogTitle>マニュアルの削除</DialogTitle>
              <DialogDescription id="delete-dialog-description">
                「{manualToDelete?.title}」を削除しますか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={() => manualToDelete && handleDelete(manualToDelete)}
              >
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ManualView;
