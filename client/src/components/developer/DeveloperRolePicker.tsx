import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DeveloperRolePickerProps {
  email: string;
  onRoleSelect: (role: string) => void;
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

export default function DeveloperRolePicker({ email, onRoleSelect }: DeveloperRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCompanyRoles();
  }, [user]);

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

  // Convert database roles to picker format with special entries
  const roles = [
    ...companyRoles.map(role => ({
      key: getRoleKey(role.level),
      label: role.name,
      description: `${role.description} (level ${role.level})`,
      color: getRoleColor(role.level)
    })),
    { key: 'new-user', label: 'New User', description: 'Experience the landing page and sign-up flow', color: '#6b7280' }
  ];

  const handleRoleSelect = async (roleKey: string) => {
    if (roleKey === 'new-user') {
      // Clear any existing cookies and reload as new user
      document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'demoUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
      return;
    }
    
    try {
      setSelectedRole(roleKey);
      
      // Create super-user session with test role
      const response = await fetch('/api/auth/super-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ testRole: roleKey })
      });

      if (response.ok) {
        console.log(`Developer session created with test role: ${roleKey}`);
        // Redirect to chat interface
        window.location.href = '/chat';
      } else {
        const error = await response.text();
        console.error('Developer authentication failed:', error);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Developer authentication error:', error);
      setSelectedRole(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '8px',
          }}>
            Developer Mode Detected
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
          }}>
            Welcome back, {email}
          </p>
          <p style={{
            color: '#64748b',
            fontSize: '14px',
            marginTop: '8px',
          }}>
            Select a role to test the application experience:
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading company roles...</div>
            </div>
          ) : roles.map((role) => (
            <button
              key={role.key}
              onClick={() => handleRoleSelect(role.key)}
              disabled={selectedRole === role.key}
              style={{
                padding: '16px',
                border: `2px solid ${role.color}`,
                borderRadius: '8px',
                backgroundColor: selectedRole === role.key ? role.color : 'white',
                color: selectedRole === role.key ? 'white' : role.color,
                cursor: selectedRole === role.key ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                opacity: selectedRole === role.key ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (selectedRole !== role.key) {
                  e.currentTarget.style.backgroundColor = role.color;
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (selectedRole !== role.key) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = role.color;
                }
              }}
            >
              <div style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '4px',
              }}>
                {role.label}
                {selectedRole === role.key && ' (Testing...)'}
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.8,
              }}>
                {role.description}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
        }}>
          Developer testing mode active. Production verification flow preserved.
        </div>
      </div>
    </div>
  );
}