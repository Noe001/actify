import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// システムのダークモード設定を検出
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// ローカルストレージからテーマ設定を取得
const getStoredThemePreference = (): ThemePreference | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('themePreference') as ThemePreference;
      return stored && ['light', 'dark', 'system'].includes(stored) ? stored : null;
    } catch (error) {
      console.warn('Failed to read theme preference from localStorage:', error);
      return null;
    }
  }
  return null;
};

// ローカルストレージにテーマ設定を保存
const storeThemePreference = (preference: ThemePreference) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('themePreference', preference);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }
  }
};

// 設定に基づいて実際のテーマを決定
const resolveTheme = (preference: ThemePreference): Theme => {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
};

// HTMLのクラス名を更新
const updateDocumentClass = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初期テーマ設定の決定（ローカルストレージ → システム設定）
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    const stored = getStoredThemePreference();
    return stored || 'system';
  });

  // 実際のテーマ状態
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredThemePreference();
    const preference = stored || 'system';
    return resolveTheme(preference);
  });

  // テーマ設定変更処理
  const setThemePreference = (newPreference: ThemePreference) => {
    setThemePreferenceState(newPreference);
    storeThemePreference(newPreference);
    const resolvedTheme = resolveTheme(newPreference);
    setThemeState(resolvedTheme);
    updateDocumentClass(resolvedTheme);
  };

  // 直接テーマ変更処理（後方互換性のため）
  const setTheme = (newTheme: Theme) => {
    setThemePreference(newTheme);
  };

  // テーマ切り替え処理（ライト ↔ ダーク）
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemePreference(newTheme);
  };

  // 初期テーマの適用
  useEffect(() => {
    updateDocumentClass(theme);
  }, []);

  // システムテーマ変更の監視（system設定の場合のみ）
  useEffect(() => {
    if (themePreference === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        updateDocumentClass(systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  const value: ThemeContextType = {
    theme,
    themePreference,
    toggleTheme,
    setTheme,
    setThemePreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// テーマコンテキストを使用するためのカスタムフック
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 

