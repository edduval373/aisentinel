import { useDeveloper } from '@/hooks/useDeveloper';

interface DeveloperRoleSwitcherProps {
  className?: string;
}

export function DeveloperRoleSwitcher({ className = '' }: DeveloperRoleSwitcherProps) {
  const { isDeveloper, testRole, actualRole, effectiveRole, setTestRole, isSettingRole } = useDeveloper();

  if (!isDeveloper) {
    return null;
  }

  const roles = [
    { value: 'demo', label: 'Demo User', level: 0, color: '#f59e0b' },
    { value: 'user', label: 'User', level: 1, color: '#10b981' },
    { value: 'admin', label: 'Admin', level: 2, color: '#3b82f6' },
    { value: 'owner', label: 'Owner', level: 99, color: '#8b5cf6' },
  ];

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
            // Clear test role by setting it to empty string
            setTestRole('');
          } else {
            setTestRole(e.target.value);
          }
        }}
        disabled={isSettingRole}
        style={{
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          padding: '4px 8px',
          color: currentRole?.color || '#e5e7eb',
          fontSize: '13px',
          fontWeight: '500',
          cursor: isSettingRole ? 'not-allowed' : 'pointer',
          opacity: isSettingRole ? 0.6 : 1
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

      {isSettingRole && (
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          Switching...
        </span>
      )}
    </div>
  );
}