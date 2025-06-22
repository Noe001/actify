import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface OrganizationGuardProps {
  children: React.ReactNode;
  feature?: string;
}

const OrganizationGuard: React.FC<OrganizationGuardProps> = ({ children, feature = 'この機能' }) => {
  const { currentOrganization, loading } = useOrganization();

  if (loading) {
    return <LoadingIndicator fullPage text="チーム情報を読み込み中..." />;
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">チームを選択してください</h2>
            <p className="text-muted-foreground mb-4">
              {feature}を利用するには、まずチームを選択する必要があります。
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/">ホームに戻る</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                チームに参加していない場合は、新しいチームを作成するか招待コードで参加してください。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default OrganizationGuard; 
