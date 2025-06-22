import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import OrganizationGuard from "@/components/OrganizationGuard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Smile, Bell, Settings, Users, Hash } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import teamAdvancedService from '@/services/teamAdvancedService';

interface Message {
  id: string;
  content: string;
  message_type: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  parent_message_id?: string;
  reply_count: number;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  files: Array<{
    id: string;
    filename: string;
    content_type: string;
    url: string;
  }>;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  channel_type: string;
  unread_count: number;
  last_message_at: string;
  message_count: number;
  created_by: {
    id: string;
    name: string;
  };
}

interface DirectMessage {
  userId: number;
  name: string;
  avatar?: string;
  initials: string;
  status: "online" | "offline" | "away" | "busy";
  unreadCount?: number;
}

const TeamChatView: React.FC<{ teamId: string }> = ({ teamId }) => {
  const [currentTab, setCurrentTab] = useState("channels");
  const [currentChannelId, setCurrentChannelId] = useState<string>("");
  const [currentDmUserId, setCurrentDmUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    channel_type: 'public'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChannels();
  }, [teamId]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
      markChannelAsRead();
    }
  }, [selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannels = async () => {
    try {
      const response = await teamAdvancedService.getTeamChannels(teamId);
      if (response.success) {
        setChannels(response.data);
        if (response.data.length > 0 && !selectedChannel) {
          setSelectedChannel(response.data[0]);
        }
      }
    } catch (error) {
      toast.error('チャンネル一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChannel) return;

    try {
      const response = await teamAdvancedService.getChannelMessages(teamId, selectedChannel.id);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      toast.error('メッセージの取得に失敗しました');
    }
  };

  const markChannelAsRead = async () => {
    if (!selectedChannel) return;

    try {
      await teamAdvancedService.markChannelAsRead(teamId, selectedChannel.id);
      // チャンネル一覧の未読数を更新
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id ? { ...ch, unread_count: 0 } : ch
      ));
    } catch (error) {
      console.error('既読マークに失敗しました:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!selectedChannel || !newMessage.trim()) return;

    try {
      const response = await teamAdvancedService.sendMessage(teamId, selectedChannel.id, {
        content: newMessage
      });

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        // チャンネル一覧のメッセージ数を更新
        setChannels(prev => prev.map(ch => 
          ch.id === selectedChannel.id 
            ? { ...ch, message_count: ch.message_count + 1, last_message_at: new Date().toISOString() }
            : ch
        ));
      }
    } catch (error) {
      toast.error('メッセージの送信に失敗しました');
    }
  };

  const createChannel = async () => {
    try {
      const response = await teamAdvancedService.createTeamChannel(teamId, newChannelData);
      if (response.success) {
        setChannels(prev => [...prev, response.data]);
        setShowCreateChannel(false);
        setNewChannelData({ name: '', description: '', channel_type: 'public' });
        toast.success('チャンネルを作成しました');
      }
    } catch (error) {
      toast.error('チャンネルの作成に失敗しました');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!selectedChannel || files.length === 0) return;

    try {
      const response = await teamAdvancedService.sendMessage(teamId, selectedChannel.id, {
        content: `${files.length}個のファイルを共有しました`,
        files
      });

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        toast.success('ファイルを送信しました');
      }
    } catch (error) {
      toast.error('ファイルの送信に失敗しました');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'direct':
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">チャンネルを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <OrganizationGuard feature="チームチャット">
        <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 bg-background border-r flex flex-col">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <div className="p-4">
              <TabsList className="w-full">
                <TabsTrigger value="channels" className="flex-1">チャンネル</TabsTrigger>
                <TabsTrigger value="direct" className="flex-1">ダイレクト</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="channels" className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={`w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left ${
                      currentChannelId === channel.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setCurrentChannelId(channel.id)}
                  >
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-2" />
                      <span>{channel.name}</span>
                      {channel.channel_type === "private" && <span className="ml-1 text-xs">🔒</span>}
                    </div>
                    {channel.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {channel.unread_count}
                      </Badge>
                    )}
                  </button>
                ))}
                <button className="w-full flex items-center p-2 text-muted-foreground text-sm hover:text-foreground">
                  <span className="mr-1">+</span> チャンネルを追加
                </button>
              </div>
            </TabsContent>

            <TabsContent value="direct" className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {directMessages.map((dm) => (
                  <button
                    key={dm.userId}
                    className={`w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left ${
                      currentDmUserId === dm.userId ? "bg-accent" : ""
                    }`}
                    onClick={() => setCurrentDmUserId(dm.userId)}
                  >
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <Avatar className="h-6 w-6">
                          {dm.avatar ? <AvatarImage src={dm.avatar} alt={dm.name} /> : null}
                          <AvatarFallback>{dm.initials}</AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 block rounded-full h-2.5 w-2.5 ${
                            dm.status === "online"
                              ? "bg-teal-primary"
                              : dm.status === "busy"
                              ? "bg-red-500"
                              : dm.status === "away"
                              ? "bg-teal-secondary"
                              : "bg-support-textGray"
                          }`}
                        />
                      </div>
                      <span>{dm.name}</span>
                    </div>
                    {dm.unreadCount ? (
                      <Badge variant="destructive" className="ml-auto">
                        {dm.unreadCount}
                      </Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* チャンネルヘッダー */}
          <div className="border-b p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium flex items-center">
                {currentTab === "channels" ? (
                  <>
                    <Hash className="h-5 w-5 mr-2" />
                    {channels.find((c) => c.id === currentChannelId)?.name}
                  </>
                ) : (
                  <>
                    {directMessages.find((d) => d.userId === currentDmUserId)?.name || "メッセージを選択"}
                  </>
                )}
              </h2>
              {currentTab === "channels" && (
                <p className="text-sm text-muted-foreground">
                  {channels.find((c) => c.id === currentChannelId)?.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-muted-foreground hover:text-foreground">
                <Users className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <Avatar>
                  {msg.user.avatar_url ? <AvatarImage src={msg.user.avatar_url} alt={msg.user.name} /> : null}
                  <AvatarFallback>{msg.user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline">
                    <span className="font-medium mr-2">{msg.user.name}</span>
                    <span className="text-xs text-muted-foreground">{formatMessageTime(msg.created_at)}</span>
                  </div>
                  <p className="mt-1">{msg.content}</p>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.files.map((file) => (
                        <Card key={file.id} className="p-2 bg-accent hover:bg-accent/80 cursor-pointer">
                          <CardContent className="p-0 flex items-center">
                            <Paperclip className="h-4 w-4 mr-2" />
                            <span className="text-sm">{file.filename}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力エリア */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="メッセージを入力..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon" className="rounded-full">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      </OrganizationGuard>
    </div>
  );
};

export default TeamChatView; 
