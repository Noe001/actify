import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以下で入力してください'),
  password: z.string()
    .min(1, 'パスワードを入力してください')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignup }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        onSuccess?.();
      } else {
        setError('メールアドレスまたはパスワードが正しくありません。');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // APIエラーの場合
      if (err.errors && Array.isArray(err.errors)) {
        // フィールド固有のエラーを設定
        err.errors.forEach((errorMsg: string) => {
          if (errorMsg.includes('メール')) {
            setFieldError('email', { message: errorMsg });
          } else if (errorMsg.includes('パスワード')) {
            setFieldError('password', { message: errorMsg });
          }
        });
        setError(err.message || 'ログインに失敗しました');
      } else {
        setError(err.message || 'ログイン中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
        <CardDescription className="text-center">
          アカウントにログインしてください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* メールアドレス */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              {...register('email')}
              className={`${errors.email ? 'border-red-500' : ''} bg-background text-foreground placeholder:text-muted-foreground`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="パスワードを入力"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </Button>

          {onSwitchToSignup && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない方は{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-teal-primary hover:text-teal-dark font-medium"
                >
                  新規登録
                </button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}; 
