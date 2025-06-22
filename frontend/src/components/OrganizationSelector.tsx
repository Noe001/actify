import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

const OrganizationSelector: React.FC = () => {
  const { organizations, currentOrganization, loading, setCurrentOrganization } = useOrganization();

  if (loading) {
    return <LoadingIndicator size="sm" text="チームを読み込み中..." />;
  }

  const handleOrganizationChange = (organizationId: string) => {
    const selectedOrg = organizations.find(org => org.id === organizationId);
    if (selectedOrg) {
      setCurrentOrganization(selectedOrg);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentOrganization?.id || ''}
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="チームを選択..." />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                {org.description && (
                  <span className="text-xs text-muted-foreground">{org.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrganizationSelector; 
