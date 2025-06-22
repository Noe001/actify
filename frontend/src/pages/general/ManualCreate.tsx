import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Tags, Users, Save, Send, Edit, Eye } from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ManualFormData, manualService } from '@/services/manualService';
import { DEPARTMENTS, CATEGORIES, ACCESS_LEVELS, EDIT_PERMISSIONS } from '@/constants/manual';
import { renderMarkdown } from '@/utils/markdown';

const ManualCreateView: React.FC = () => {
  const navigate = useNavigate();

  // フォームデータ
  const [formData, setFormData] = useState<ManualFormData>({
    title: '',
    content: '',
    department: '',
    category: '',
    access_level: 'all',
    edit_permission: 'author',
    status: 'draft',
    tags: '',
  });

  // フォーム入力処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof ManualFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // マニュアル保存
  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    if (!formData.department) {
      toast.error('部門を選択してください');
      return;
    }

    if (!formData.category) {
      toast.error('カテゴリーを選択してください');
      return;
    }

    try {
      // API呼び出し
      const dataToSave = { ...formData, status };
      const response = await manualService.createManual(dataToSave);
      
      if (response.success) {
        toast.success(status === 'draft' ? '下書きを保存しました' : 'マニュアルを作成しました');
        navigate('/manual');
      } else {
        // APIからのエラーメッセージを表示
        toast.error(response.message || 'マニュアルの作成に失敗しました');
      }
    } catch (error: any) {
      // ネットワークエラーなど、API呼び出し自体が失敗した場合
      toast.error(error.message || 'マニュアルの作成に失敗しました');
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/manual')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            マニュアル一覧に戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground">新規マニュアル作成</h1>
          <p className="text-muted-foreground">新しい業務マニュアルを作成します</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインエディター */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  マニュアル内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">
                    タイトル <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="マニュアルのタイトルを入力"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">内容（Markdown対応）</Label>
                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        編集
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        プレビュー
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit" className="mt-4">
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="マニュアルの内容をMarkdown形式で入力してください&#10;&#10;例:&#10;# 見出し1&#10;## 見出し2&#10;**太字** *斜体*&#10;- リスト項目1&#10;- リスト項目2&#10;&#10;```&#10;コードブロック&#10;```"
                        value={formData.content}
                        onChange={handleInputChange}
                        className="min-h-[400px] font-mono"
                      />
                      <div className="mt-2 text-xs text-muted-foreground">
                        MarkdownでHTMLを記述できます。見出し、リスト、コードブロック、リンクなどがサポートされています。
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-md p-4 min-h-[400px] bg-background">
                        {formData.content ? (
                          <div 
                            className="prose max-w-none prose-sm [&_h1]:text-[1.75rem] [&_h2]:text-2xl [&_h3]:text-xl [&_h4]:text-base [&_p]:my-0.5 [&_h1]:mb-1 [&_h2]:mb-1 [&_h2]:mt-0.5 [&_h3]:mb-0.5 [&_h4]:mb-0.5 [&_h5]:mb-0.5 [&_h6]:mb-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_blockquote]:my-1 [&_h1]:border-b [&_h1]:border-gray-300 [&_h1]:pb-1"
                            dangerouslySetInnerHTML={{ 
                              __html: renderMarkdown(formData.content) 
                            }}
                          />
                        ) : (
                          <div className="text-muted-foreground italic">
                            内容を入力するとここにプレビューが表示されます
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div>
                  <Label htmlFor="tags">タグ</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="タグをカンマ区切りで入力（例: 手順,重要,新人向け）"
                    value={formData.tags}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 設定サイドバー */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tags className="h-5 w-5 mr-2" />
                  カテゴリー設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    部門 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleSelectChange('department')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    カテゴリー <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange('category')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  アクセス権限
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>閲覧権限</Label>
                  <Select
                    value={formData.access_level}
                    onValueChange={handleSelectChange('access_level')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>編集権限</Label>
                  <Select
                    value={formData.edit_permission}
                    onValueChange={handleSelectChange('edit_permission')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDIT_PERMISSIONS.map(perm => (
                        <SelectItem key={perm.value} value={perm.value}>
                          {perm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={() => handleSave('draft')}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  下書き保存
                </Button>
                <Button
                  onClick={() => handleSave('published')}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  公開
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManualCreateView; 
