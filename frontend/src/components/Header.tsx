import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Home,
  MessageSquare,

  Menu,
  User,
  Settings,
  LogOut,
  CheckSquare,
  FileText,
  Database,
  Calendar,
  Plus,
  Clock,
  Moon,
  Sun,
  Shield
  } from "lucide-react";
  import { useAuth } from "@/contexts/AuthContext";
  import { useTheme } from "@/contexts/ThemeContext";

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// ナビゲーションリンクの定義
const navigationLinks = [
  { path: "/", icon: Home, label: "ホーム" },
  { path: "/tasks", icon: CheckSquare, label: "タスク管理" },
  { path: "/team_chat", icon: MessageSquare, label: "チーム会話" },
  { path: "/attendance", icon: Clock, label: "勤怠管理" },
];

// 新規作成メニュー項目
const creationMenuItems = [
  { path: "/knowledge_base", icon: Database, label: "ナレッジベース" },
  { path: "/manual", icon: FileText, label: "マニュアル" },
  { path: "/meeting", icon: Calendar, label: "ミーティング" },
];

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentWorkspace, isWorkspaceAdmin } = useWorkspace();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // ログアウト処理
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
    await logout();
      navigate('/login');
      toast.success('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      toast.error('ログアウトに失敗しました');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ユーザー表示名の取得
  const getUserDisplayName = () => {
    if (user?.display_name) {
      return user.display_name;
    }
    if (user?.name) {
      return user.name;
    }
          return "ユーザー";
    };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md">
      <div className="container mx-auto flex h-14 items-center px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path} className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            {/* モバイル用の新規作成メニュー */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>新規作成</DropdownMenuLabel>
            {creationMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center gap-2 font-semibold">
          <Link to="/" className="flex items-center">
            {/* 狭い画面では通常のロゴ */}
            <img 
              src="/images/actify_logo.png" 
              alt="Actify" 
              className="h-7 w-7 md:hidden" 
            />
            {/* 広い画面ではフルロゴ */}
            <img 
              src="/images/actify_logo_full.png" 
              alt="Actify" 
              className="h-7 hidden md:block" 
            />
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-4 mx-6 overflow-x-auto">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1"
                asChild
              >
                <Link to={link.path}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              </Button>
            );
          })}
          
          {/* 新規作成ドロップダウンメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  location.pathname === "/knowledge_base" || 
                  location.pathname === "/manual" || 
                  location.pathname === "/meeting" 
                    ? "default" 
                    : "ghost"
                }
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">新規作成</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {creationMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className={`flex items-center ${isActive ? 'bg-muted' : ''}`}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
                         <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
          {/* テーマ切り替えボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          

          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>通知</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/notification_center" className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">会議リマインド</span>
                    <span className="text-sm text-muted-foreground">14:00 プロジェクトMTG</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tasks" className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">タスク期限</span>
                    <span className="text-sm text-muted-foreground">マニュアル作成 本日期限</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/notification_center" className="cursor-pointer flex items-center">
                  すべての通知を見る
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
                      <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full [&_svg]:size-6">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {user?.department && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {user.department}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* 管理者ダッシュボード */}
              {isWorkspaceAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>管理者ダッシュボード</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                <span>プロフィール</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                <span>設定</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'ログアウト中...' : 'ログアウト'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header; 
