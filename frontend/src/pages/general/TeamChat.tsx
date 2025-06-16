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

interface Message {
  id: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  attachments?: { name: string; url: string; type: string }[];
  reactions?: { emoji: string; count: number }[];
}

interface Channel {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  unreadCount?: number;
}

interface DirectMessage {
  userId: number;
  name: string;
  avatar?: string;
  initials: string;
  status: "online" | "offline" | "away" | "busy";
  unreadCount?: number;
}

const TeamChatView: React.FC = () => {
  const [currentTab, setCurrentTab] = useState("channels");
  const [currentChannelId, setCurrentChannelId] = useState<number>(1);
  const [currentDmUserId, setCurrentDmUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // サンプルデータ
  const channels: Channel[] = [
    { id: 1, name: "一般", description: "一般的な話題のチャンネル", isPrivate: false, unreadCount: 0 },
    { id: 2, name: "プロジェクトA", description: "プロジェクトAに関する議論", isPrivate: false, unreadCount: 3 },
    { id: 3, name: "マーケティング", description: "マーケティング戦略の議論", isPrivate: true, unreadCount: 0 },
    { id: 4, name: "アイデア", description: "新しいアイデアの共有", isPrivate: false, unreadCount: 0 },
  ];

  const directMessages: DirectMessage[] = [
    { userId: 1, name: "佐藤太郎", initials: "ST", status: "online", unreadCount: 2 },
    { userId: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH", status: "busy" },
    { userId: 3, name: "田中誠", initials: "TM", status: "offline" },
    { userId: 4, name: "伊藤美咲", initials: "IM", status: "away" },
  ];

  const channelMessages: Message[] = [
    {
      id: 1,
      user: { id: 1, name: "佐藤太郎", initials: "ST" },
      content: "おはようございます！今日のミーティングの議題は何ですか？",
      timestamp: "09:15",
    },
    {
      id: 2,
      user: { id: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
      content: "新しいプロジェクトの進捗と、次週の予定確認です。資料を添付しておきます。",
      timestamp: "09:17",
      attachments: [{ name: "プロジェクト進捗.pdf", url: "#", type: "pdf" }],
    },
    {
      id: 3,
      user: { id: 3, name: "田中誠", initials: "TM" },
      content: "承知しました。ミーティングの前に確認しておきます。",
      timestamp: "09:20",
      reactions: [{ emoji: "👍", count: 2 }],
    },
    {
      id: 4,
      user: { id: 4, name: "伊藤美咲", initials: "IM" },
      content: "私も参加します。先週のフィードバックも議題に入れてもらえますか？",
      timestamp: "09:22",
    },
    {
      id: 5,
      user: { id: 1, name: "佐藤太郎", initials: "ST" },
      content: "了解です。議題に追加しておきます。",
      timestamp: "09:25",
    },
  ];

  const dmMessages: Message[] = [
    {
      id: 1,
      user: { id: 1, name: "佐藤太郎", initials: "ST" },
      content: "プロジェクトの進捗はどうですか？",
      timestamp: "10:15",
    },
    {
      id: 2,
      user: { id: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
      content: "順調に進んでいます。来週には完了予定です。",
      timestamp: "10:17",
    },
  ];

  // 選択されているチャネルまたはDMのメッセージを取得
  const getActiveMessages = () => {
    if (currentTab === "channels") {
      return channelMessages;
    } else {
      return dmMessages;
    }
  };

  // メッセージを送信
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    
    // ここでメッセージ送信のAPIを呼び出す想定
    // 実際の実装ではバックエンドAPIとの連携が必要

    
    // メッセージを送信後、入力フィールドをクリア
    setMessage("");
  };

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [getActiveMessages()]);

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
                      {channel.isPrivate && <span className="ml-1 text-xs">🔒</span>}
                    </div>
                    {channel.unreadCount ? (
                      <Badge variant="destructive" className="ml-auto">
                        {channel.unreadCount}
                      </Badge>
                    ) : null}
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
            {getActiveMessages().map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <Avatar>
                  {msg.user.avatar ? <AvatarImage src={msg.user.avatar} alt={msg.user.name} /> : null}
                  <AvatarFallback>{msg.user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline">
                    <span className="font-medium mr-2">{msg.user.name}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="mt-1">{msg.content}</p>
                  {msg.attachments && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((attachment, index) => (
                        <Card key={index} className="p-2 bg-accent hover:bg-accent/80 cursor-pointer">
                          <CardContent className="p-0 flex items-center">
                            <Paperclip className="h-4 w-4 mr-2" />
                            <span className="text-sm">{attachment.name}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {msg.reactions && (
                    <div className="mt-2 flex space-x-2">
                      {msg.reactions.map((reaction, index) => (
                        <Badge key={index} variant="outline" className="py-0 px-2">
                          <span className="mr-1">{reaction.emoji}</span>
                          <span className="text-xs">{reaction.count}</span>
                        </Badge>
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
