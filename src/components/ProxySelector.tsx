import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Eye } from 'lucide-react';
import { GetRepsOutputType } from '@/lib/api';
import { useProxy } from '../contexts/ProxyContext';
import { useReps } from '../contexts/RepsContext';
import { isManagerRole } from '@server/lib/roles';

type Pro = GetRepsOutputType['pros'][0];

interface ProxySelectorProps {
  isManager: boolean;
  /** @deprecated Use variant instead */
  darkHeader?: boolean;
  variant?: 'default' | 'sidebar';
}

export default function ProxySelector({ isManager, darkHeader, variant = 'default' }: ProxySelectorProps) {
  const { originalUser, currentUser, isProxying, setProxy, clearProxy } = useProxy();
  const { pros: allPros, loading } = useReps();

  const pros = allPros.filter(pro => !isManagerRole(pro.role) && pro.id !== originalUser?.id);

  if (!isManager) return null;

  const handleProxyChange = (selectedId: string) => {
    if (selectedId === 'none') {
      clearProxy();
    } else {
      const selectedPro = pros.find(pro => pro.id === selectedId);
      if (selectedPro) {
        setProxy({
          id: selectedPro.id,
          email: selectedPro.email || '',
          proName: selectedPro.proName || '',
          displayName: selectedPro.displayName || '',
          role: selectedPro.role || '',
        });
      }
    }
  };

  const isSidebar = variant === 'sidebar';

  return (
    <Select
      value={isProxying ? currentUser?.id || '' : 'none'}
      onValueChange={handleProxyChange}
      disabled={loading}
    >
      <SelectTrigger
        className={
          isSidebar
            ? 'w-full h-8 text-xs border-[hsl(var(--header-border))] bg-[hsl(var(--header-bg))] text-[hsl(var(--header-foreground)/0.8)] hover:bg-[hsl(var(--header-border))]'
            : 'w-full h-9 text-sm border-border'
        }
      >
        <SelectValue placeholder="My View" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="font-medium">My View</span>
        </SelectItem>
        {pros.map(pro => (
          <SelectItem key={pro.id} value={pro.id}>
            {pro.displayName || pro.proName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
