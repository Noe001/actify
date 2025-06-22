import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import organizationService, { Organization } from '@/services/organizationService';

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // ローカルストレージからチーム情報を復元
  useEffect(() => {
    const savedOrgId = localStorage.getItem('currentOrganizationId');
    if (savedOrgId) {
      // チーム一覧を取得してから現在のチームを設定
      refreshOrganizations().then(() => {
        const savedOrg = organizations.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setCurrentOrganizationState(savedOrg);
        }
      });
    } else {
      refreshOrganizations();
    }
  }, []);

  const setCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      localStorage.setItem('currentOrganizationId', org.id);
    } else {
      localStorage.removeItem('currentOrganizationId');
    }
  };

  const refreshOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('チームの取得に失敗しました:', error);
      // エラー時はダミーデータを設定
      setOrganizations([
        {
          id: '1',
          name: 'サンプルチーム',
          description: 'デモ用のチームです',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    loading,
    setCurrentOrganization,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}; 
