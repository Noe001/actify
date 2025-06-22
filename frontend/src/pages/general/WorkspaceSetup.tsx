import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Plus, 
  ExternalLink,
  Loader2,
  Users,
  Shield,
  Globe,
  Lock
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import workspaceService, { CreateWorkspaceRequest, JoinWorkspaceRequest } from '@/services/workspaceService';

const WorkspaceSetup: React.FC = () => {
  const { refreshWorkspaces, setCurrentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  
  // 企業作成フォーム
  const [createForm, setCreateForm] = useState<CreateWorkspaceRequest>({
    name: '',
    subdomain: '',
    description: '',
    is_public: false,
    primary_color: '#4A154B',
    accent_color: '#007A5A'
  });
  
  // 企業参加フォーム
  const [joinForm, setJoinForm] = useState<JoinWorkspaceRequest>({
    invite_code: ''
  });

  const handleCreateWorkspace = async () => {
    try {
      setLoading(true);
      
      // サブドメインのバリデーション
      if (!createForm.subdomain.match(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/)) {
        toast.error('サブドメインは英数字とハイフンのみ使用可能です');
        return;
      }
      
      const workspace = await workspaceService.createWorkspace(createForm);
      
      toast.success('企業を作成しました');
      setCreateDialogOpen(false);
      
      await refreshWorkspaces();
      setCurrentWorkspace(workspace);
      navigate('/');
      
    } catch (error: any) {
      console.error('企業の作成に失敗しました:', error);
      toast.error(error.response?.data?.message || '企業の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    try {
      setLoading(true);
      
      const workspace = await workspaceService.joinWorkspace(joinForm);
      
      toast.success('企業に参加しました');
      setJoinDialogOpen(false);
      
      await refreshWorkspaces();
      setCurrentWorkspace(workspace);
      navigate('/');
      
    } catch (error: any) {
      console.error('企業への参加に失敗しました:', error);
      toast.error(error.response?.data?.message || '企業への参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* ヘッダー */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/images/actify_logo_full.png" 
              alt="Actify" 
              className="h-12" 
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            企業への参加が必要です
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Actifyを使用するには、企業に参加するか新しい企業を作成する必要があります。
            下記のオプションから選択してください。
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 企業に参加 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">既存の企業に参加</CardTitle>
              <CardDescription className="text-base">
                招待コードをお持ちの場合は、こちらから企業に参加できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>チームメンバーと協力</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>セキュアな企業環境</span>
                </div>
              </div>
              <Button 
                onClick={() => setJoinDialogOpen(true)}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                企業に参加
              </Button>
            </CardContent>
          </Card>

          {/* 企業を作成 */}
          <Card className="hover:shadow-lg transition-shadow border-primary">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">新しい企業を作成</CardTitle>
              <CardDescription className="text-base">
                あなたの組織用の新しい企業を作成し、チームを招待しましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>完全な管理者権限</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>メンバーの招待と管理</span>
                </div>
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                企業を作成
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 追加情報 */}
        <Card className="bg-white/50 dark:bg-gray-800/50 border-dashed">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              企業について
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              企業は、チームメンバーが協力してタスク管理、ミーティング、マニュアル作成などを行うための
              セキュアなワークスペースです。企業に参加することで、すべての機能をご利用いただけます。
            </p>
          </CardContent>
        </Card>

        {/* 企業作成ダイアログ */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新しい企業を作成</DialogTitle>
              <DialogDescription>
                新しい企業を作成して、チームメンバーを招待しましょう。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">企業名</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="株式会社サンプル"
                />
              </div>
              <div>
                <Label htmlFor="subdomain">サブドメイン</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={createForm.subdomain}
                    onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value.toLowerCase() })}
                    placeholder="sample-company"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">.actify.com</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  英数字とハイフンのみ使用可能です
                </p>
              </div>
              <div>
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="企業の説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_public">公開企業</Label>
                <Switch
                  id="is_public"
                  checked={createForm.is_public}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, is_public: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                公開企業は検索で見つけることができます
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={loading || !createForm.name || !createForm.subdomain}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 企業参加ダイアログ */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>企業に参加</DialogTitle>
              <DialogDescription>
                招待コードを入力して既存の企業に参加してください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite_code">招待コード</Label>
                <Input
                  id="invite_code"
                  value={joinForm.invite_code}
                  onChange={(e) => setJoinForm({ ...joinForm, invite_code: e.target.value.toUpperCase() })}
                  placeholder="ABC123DEF456"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  企業管理者から受け取った招待コードを入力してください
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleJoinWorkspace} disabled={loading || !joinForm.invite_code}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                参加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WorkspaceSetup; 
