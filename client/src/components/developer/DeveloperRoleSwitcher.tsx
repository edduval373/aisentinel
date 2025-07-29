import { useDeveloper } from '@/hooks/useDeveloper';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface DeveloperRoleSwitcherProps {
  className?: string;
}

interface CompanyRole {
  id: number;
  name: string;
  level: number;
  description: string;
}

const getRoleColor = (level: number) => {
  if (level === 1000) return '#dc2626'; // Super User (Red)
  if (level === 999) return '#8b5cf6'; // Owner (Purple)  
  if (level === 998) return '#3b82f6'; // Administrator (Blue)
  if (level === 1) return '#10b981'; // User (Green)
  if (level === 0) return '#f59e0b'; // Demo (Orange)
  return '#6b7280'; // Custom levels (Gray)
};

const getRoleKey = (level: number) => {
  if (level === 1000) return 'super-user';
  if (level === 999) return 'owner';
  if (level === 998) return 'admin';
  if (level === 1) return 'user';
  if (level === 0) return 'demo';
  return `custom-${level}`;
};

export function DeveloperRoleSwitcher({ className = '' }: DeveloperRoleSwitcherProps) {
  const { isDeveloper, testRole, actualRole, effectiveRole, switchRole, isSwitchingRole } = useDeveloper();
  const { user } = useAuth();
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDeveloper) {
      fetchCompanyRoles();
    }
  }, [isDeveloper, user]);

  const fetchCompanyRoles = async () => {
    try {
      setLoading(true);
      const companyId = user?.companyId || 1; // Default to company 1
      const response = await fetch(`/api/company/roles/${companyId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const roles = await response.json();
        // Sort by level in descending order (1000 → 0)
        const sortedRoles = roles.sort((a: CompanyRole, b: CompanyRole) => b.level - a.level);
        setCompanyRoles(sortedRoles);
      }
    } catch (error) {
      console.error('Error fetching company roles:', error);
      // Fallback to basic roles if API fails
      setCompanyRoles([
        { id: 1, name: 'Super User', level: 1000, description: 'Full system access and company management' },
        { id: 2, name: 'Owner', level: 999, description: 'Company setup and configuration access' },
        { id: 3, name: 'Administrator', level: 998, description: 'Security settings, user management' },
        { id: 4, name: 'User', level: 1, description: 'Basic chat interface access' },
        { id: 5, name: 'Demo User', level: 0, description: 'Limited demo access with read-only features' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isDeveloper) {
    return null;
  }

  // Convert database roles to switcher format
  const roles = companyRoles.map(role => ({
    value: getRoleKey(role.level),
    label: role.name,
    level: role.level,
    color: getRoleColor(role.level)
  }));

  const currentRole = roles.find(r => r.value === testRole) || roles.find(r => r.level === actualRole);

  return (
    <div className={`developer-role-switcher ${className}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#e5e7eb'
    }}>
      <span style={{ 
        color: '#9ca3af',
        fontWeight: '500'
      }}>
        DEV:
      </span>
      
      <select
        value={testRole || 'actual'}
        onChange={(e) => {
          if (e.target.value === 'actual') {
            // Clear test role by switching to empty string
            switchRole('');
          } else {
            switchRole(e.target.value);
          }
        }}
        disabled={isSwitchingRole}
        style={{
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          padding: '4px 8px',
          color: currentRole?.color || '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500',
          cursor: isSwitchingRole ? 'not-allowed' : 'pointer',
          opacity: isSwitchingRole ? 0.6 : 1
        }}
      >
        <option value="actual" style={{ color: '#e5e7eb' }}>
          Actual Role (Level {actualRole})
        </option>
        {roles.map(role => (
          <option key={role.value} value={role.value} style={{ color: role.color }}>
            {role.label} (Level {role.level})
          </option>
        ))}
      </select>

      {testRole && (
        <span style={{
          color: currentRole?.color || '#e5e7eb',
          fontWeight: '600',
          fontSize: '12px'
        }}>
          Testing: {currentRole?.label}
        </span>
      )}

      {isSwitchingRole && (
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          Switching...
        </span>
      )}
    </div>
  );
}