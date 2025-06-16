import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';
import { AUTH_ERROR_EVENT } from '../services/api';
import { User, SignupRequest, LoginRequest } from '../types/api';

// 認証コンテキストの型定義
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// デフォルト値を設定
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  clearError: () => {}
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// コンテキストを使用するためのカスタムフック
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初期化時に保存されている認証情報を確認
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUserData = localStorage.getItem('user_data');
      
      if (token) {
        try {
          // 保存されたユーザーデータがある場合、まずそれを使用して即座に認証状態を設定
          if (savedUserData) {
            try {
              const userData = JSON.parse(savedUserData);
              setIsAuthenticated(true);
              setUser(userData);
            } catch (parseError) {
              console.error('Failed to parse saved user data:', parseError);
            }
          }
          
          // バックエンドでトークンの検証を行う（バックグラウンドで実行）
          const response = await authAPI.me();
          if (response.success && response.data) {
            setIsAuthenticated(true);
            setUser(response.data);
            // 最新のユーザーデータを保存
            localStorage.setItem('user_data', JSON.stringify(response.data));
          } else {
            clearAuthData();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          clearAuthData();
        }
      } else {
        // トークンがない場合は認証されていない
        clearAuthData();
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // 認証エラーイベントのリスナーを設定
  useEffect(() => {
    const handleAuthError = () => {
      clearAuthData();
    };

    // イベントリスナーを追加
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);

    // クリーンアップ関数
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);
    };
  }, []);

  // 認証データをクリアしてログアウト状態にする関数
  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('currentWorkspaceId'); // ワークスペース情報もクリア
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    // APIクライアントの認証ヘッダーもクリア
    delete axios.defaults.headers.common['Authorization'];
  };

  // エラーをクリアする関数
  const clearError = () => {
    setError(null);
  };

  // ログイン関数
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const loginData: LoginRequest = { email, password };
      const response = await authAPI.login(loginData);
      
      if (response.success && response.data) {
        // 成功時の処理
        const token = response.data.token;
        const userData = response.data.user;
        
        // トークンとユーザーデータをストレージに保存
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // 認証状態を更新
        setIsAuthenticated(true);
        setUser(userData);
        
        return { success: true };
      }
      
      const errorMessage = response.message || 'ログインに失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      let errorMessage = 'ログインに失敗しました';
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // サインアップ関数
  const signup = async (data: SignupRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const response = await authAPI.signup(data);
      
      if (response.success && response.data) {
        // 成功時の処理
        const token = response.data.token;
        const userData = response.data.user;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // 認証状態を更新
        setIsAuthenticated(true);
        setUser(userData);
        
        return { success: true };
      }
      
      const errorMessage = response.message || 'アカウントの作成に失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (error: any) {
      console.error('Signup failed:', error);
      
      let errorMessage = 'アカウントの作成に失敗しました';
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ログアウト関数
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthData();
    }
  };

  // ユーザー情報の更新
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  // ユーザー情報の再取得
  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user_data', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
