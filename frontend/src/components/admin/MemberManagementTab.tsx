import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Edit,
  Trash2,
  Plus,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import teamService, { Team, TeamMember } from '@/services/teamService';
import workspaceService, { WorkspaceMember } from '@/services/workspaceService';

interface MemberManagementTabProps {
  workspaceId?: string;
}

const MemberManagementTab: React.FC<MemberManagementTabProps> = ({ workspaceId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // チーム作成フォーム
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    leader_id: ''
  });

  // メンバー追加フォーム
  const [addMemberForm, setAddMemberForm] = useState({
    user_id: '',
    role: 'member'
  });

  useEffect(() => {
    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsResponse, membersResponse] = await Promise.all([
        teamService.getTeams(workspaceId),
        workspaceService.getMembers(workspaceId!)
      ]);

      if (teamsResponse.success) {
        setTeams(teamsResponse.data);
      }

      if (membersResponse.success) {
        setMembers(membersResponse.data);
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const response = await teamService.createTeam(newTeamForm);
      if (response.success) {
        toast.success(response.message);
        setShowCreateTeamDialog(false);
        setNewTeamForm({ name: '', description: '', color: '#3B82F6', leader_id: '' });
        fetchData();
      }
    } catch (error) {
      console.error('チームの作成に失敗しました:', error);
      toast.error('チームの作成に失敗しました');
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`チーム「${team.name}」を削除しますか？`)) return;

    try {
      const response = await teamService.deleteTeam(team.id);
      if (response.success) {
        toast.success(response.message);
        fetchData();
      }
    } catch (error) {
      console.error('チームの削除に失敗しました:', error);
      toast.error('チームの削除に失敗しました');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam) return;

    try {
      const response = await teamService.addMember(selectedTeam.id, addMemberForm);
      if (response.success) {
        toast.success(response.message);
        setShowAddMemberDialog(false);
        setAddMemberForm({ user_id: '', role: 'member' });
        fetchData();
      }
    } catch (error) {
      console.error('メンバーの追加に失敗しました:', error);
      toast.error('メンバーの追加に失敗しました');
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string, userName: string) => {
    if (!confirm(`${userName}をチームから削除しますか？`)) return;

    try {
      const response = await teamService.removeMember(teamId, userId);
      if (response.success) {
        toast.success(response.message);
        fetchData();
      }
    } catch (error) {
      console.error('メンバーの削除に失敗しました:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  const handleChangeLeader = async (teamId: string, newLeaderId: string) => {
    try {
      const response = await teamService.changeLeader(teamId, newLeaderId);
      if (response.success) {
        toast.success(response.message);
        fetchData();
      }
    } catch (error) {
      console.error('リーダーの変更に失敗しました:', error);
      toast.error('リーダーの変更に失敗しました');
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableMembers = members.filter(member => {
    if (!selectedTeam) return true;
    return !selectedTeam.members?.some(teamMember => teamMember.id === member.id);
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">メンバー管理</h2>
          <p className="text-muted-foreground">チームとメンバーの管理</p>
        </div>
        <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              チーム作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいチームを作成</DialogTitle>
              <DialogDescription>
                チーム名、説明、カラーテーマを設定してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">チーム名</Label>
                <Input
                  id="team-name"
                  value={newTeamForm.name}
                  onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="チーム名を入力"
                />
              </div>
              <div>
                <Label htmlFor="team-description">説明</Label>
                <Textarea
                  id="team-description"
                  value={newTeamForm.description}
                  onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="チームの説明を入力"
                />
              </div>
              <div>
                <Label>カラーテーマ</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTeamForm.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTeamForm(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="team-leader">チームリーダー（オプション）</Label>
                <Select
                  value={newTeamForm.leader_id || "none"}
                  onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, leader_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="リーダーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">リーダーなし</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTeamDialog(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleCreateTeam}>作成</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">チーム管理</TabsTrigger>
          <TabsTrigger value="members">メンバー一覧</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="activities">活動ログ</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <Card key={team.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMemberDialog(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTeam(team)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">メンバー数</span>
                      <Badge variant="secondary">{team.member_count}名</Badge>
                    </div>
                    {team.leader && (
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{team.leader.name}</span>
                      </div>
                    )}
                    {team.stats && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">進行中タスク</span>
                          <div className="font-medium">{team.stats.active_tasks}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">完了タスク</span>
                          <div className="font-medium">{team.stats.completed_tasks}</div>
                        </div>
                      </div>
                    )}
                    {team.members && team.members.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-2">メンバー</div>
                        <div className="space-y-1">
                          {team.members.slice(0, 3).map(member => (
                            <div key={member.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{member.name}</span>
                                {member.role === 'leader' && (
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(team.id, member.id, member.name)}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              他 {team.members.length - 3} 名
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="メンバーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>全メンバー一覧</CardTitle>
              <CardDescription>ワークスペースの全メンバー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        {member.department && (
                          <div className="text-xs text-muted-foreground">{member.department}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">総チーム数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
                <p className="text-xs text-muted-foreground">アクティブチーム</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">総メンバー数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
                <p className="text-xs text-muted-foreground">全ワークスペース</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">平均チームサイズ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + team.member_count, 0) / teams.length) : 0}
                </div>
                <p className="text-xs text-muted-foreground">人/チーム</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">アクティブ率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teams.length > 0 ? Math.round((teams.filter(t => t.member_count > 0).length / teams.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">メンバー有りチーム</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>チーム別統計</CardTitle>
                <CardDescription>各チームの活動状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">{team.member_count}名</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          活動: {team.stats?.recent_activities || 0}件
                        </div>
                        <div className="text-xs text-muted-foreground">
                          チャンネル: {team.stats?.total_channels || 0}個
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>メンバー分析</CardTitle>
                <CardDescription>役割別・部門別分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">役割別分布</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        members.reduce((acc, member) => {
                          acc[member.role] = (acc[member.role] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([role, count]) => (
                        <div key={role} className="flex justify-between">
                          <span className="text-sm">{role}</span>
                          <Badge variant="secondary">{count}名</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">参加時期</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        members.reduce((acc, member) => {
                          const month = new Date(member.joined_at).toLocaleDateString('ja-JP', { 
                            year: 'numeric', 
                            month: 'short' 
                          });
                          acc[month] = (acc[month] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).slice(-6).map(([month, count]) => (
                        <div key={month} className="flex justify-between">
                          <span className="text-sm">{month}</span>
                          <Badge variant="outline">{count}名</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>最近の活動ログ</CardTitle>
              <CardDescription>全チームの活動履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.flatMap(team => 
                  // ここでは各チームの活動として模擬データを表示
                  // 実際の実装では team.activities を使用
                  [
                    {
                      id: `${team.id}-1`,
                      team: team.name,
                      teamColor: team.color,
                      type: 'member_joined',
                      title: `${team.leader?.name || 'メンバー'}がチームに参加しました`,
                      timestamp: new Date().toISOString(),
                      user: team.leader
                    },
                    {
                      id: `${team.id}-2`,
                      team: team.name,
                      teamColor: team.color,
                      type: 'team_created',
                      title: 'チームが作成されました',
                      timestamp: new Date(new Date().getTime() - 86400000).toISOString(),
                      user: team.leader
                    }
                  ]
                ).slice(0, 10).map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div
                      className="w-3 h-3 rounded-full mt-2"
                      style={{ backgroundColor: activity.teamColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.team}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {activity.type === 'member_joined' ? '参加' : 
                           activity.type === 'team_created' ? '作成' : 
                           activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {activity.user && (
                          <div className="flex items-center space-x-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {activity.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{activity.user.name}</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* メンバー追加ダイアログ */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>チームメンバーを追加</DialogTitle>
            <DialogDescription>
              {selectedTeam?.name} にメンバーを追加します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-member">メンバーを選択</Label>
              <Select
                value={addMemberForm.user_id}
                onValueChange={(value) => setAddMemberForm(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="メンバーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="member-role">役割</Label>
              <Select
                value={addMemberForm.role}
                onValueChange={(value) => setAddMemberForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">メンバー</SelectItem>
                  <SelectItem value="leader">リーダー</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddMemberDialog(false)}
              >
                キャンセル
              </Button>
              <Button onClick={handleAddMember}>追加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagementTab; 
 