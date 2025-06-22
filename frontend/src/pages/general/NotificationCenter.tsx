import React, { useState } from 'react';
import { ArrowLeft , Bell, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  description: string;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: '新しいメッセージ', description: 'あなたに新しいメッセージがあります。', read: false },
    { id: 2, title: 'システム更新', description: 'システムが更新されました。', read: false },
    { id: 3, title: '会議リマインダー', description: '明日の会議をお忘れなく。', read: true },
  ]);

  const navigate = useNavigate();

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            通知センター
          </h1>
          <p className="text-muted-foreground">あなたのすべての通知をここで確認できます。</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {notifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{notification.title}</span>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)}>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter; 
