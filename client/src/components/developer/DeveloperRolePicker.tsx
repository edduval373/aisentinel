import React, { useState } from 'react';

interface DeveloperRolePickerProps {
  email: string;
  onRoleSelect: (role: string) => void;
}

const roles = [
  { key: 'new-user', label: 'New User', description: 'Experience the landing page and sign-up flow', color: '#6b7280' },
  { key: 'demo', label: 'Demo User', description: 'Limited demo access with read-only features', color: '#f59e0b' },
  { key: 'user', label: 'Regular User', description: 'Basic chat interface access', color: '#10b981' },
  { key: 'admin', label: 'Administrator', description: 'Security settings, user management (level 98)', color: '#3b82f6' },
  { key: 'owner', label: 'Owner', description: 'Company setup and configuration access', color: '#8b5cf6' },
  { key: 'super-user', label: 'Super User', description: 'Full system access and company management', color: '#dc2626' },
];

export default function DeveloperRolePicker({ email, onRoleSelect }: DeveloperRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
          {roles.map((role) => (
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