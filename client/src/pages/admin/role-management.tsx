import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button-standard";
import { useToast } from "@/hooks/use-toast";
import { hasAccessLevel } from "@/utils/roleBasedAccess";
import { UserCog, Save, RefreshCw } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roleLevel: number;
  companyId?: number;
  isTrialUser?: boolean;
}

export default function RoleManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Only super-users (level 100+) can access this page
  if (!user || !hasAccessLevel(user.roleLevel, 100)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <UserCog style={{ width: '4rem', height: '4rem', color: '#dc2626', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          Super-User Access Required
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          You need super-user privileges (level 100+) to manage user roles.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Current access level: {user?.roleLevel || 0}
        </p>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/all-users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRoleLevel: number) => {
    try {
      setSaving(userId);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ roleLevel: newRoleLevel }),
      });
      
      if (response.ok) {
        await fetchUsers(); // Refresh the list
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getRoleColor = (roleLevel: number) => {
    if (roleLevel >= 100) return '#dc2626'; // Super-user (red)
    if (roleLevel >= 99) return '#7c3aed'; // Owner (purple)
    if (roleLevel >= 2) return '#f59e0b'; // Admin (amber)
    return '#10b981'; // User (green)
  };

  const getRoleName = (roleLevel: number) => {
    if (roleLevel >= 100) return 'Super-User';
    if (roleLevel >= 99) return 'Owner';
    if (roleLevel >= 2) return 'Admin';
    return 'User';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <img 
          src="/ai-sentinel-logo.png" 
          alt="Loading" 
          style={{
            width: '64px',
            height: '64px',
            animation: 'spin 2s linear infinite',
            filter: 'brightness(1.1) saturate(1.3) contrast(1.2)',
            marginBottom: '1rem'
          }}
        />
        <p style={{ color: '#6b7280' }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            User Role Management
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage user roles and permissions for testing purposes
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          Refresh
        </Button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: '600',
          color: '#374151'
        }}>
          <div>Email</div>
          <div>Name</div>
          <div>Current Role</div>
          <div>Role Level</div>
          <div>Actions</div>
        </div>

        {users.map((userData) => (
          <div key={userData.id} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
            gap: '1rem',
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: '500', color: '#1f2937' }}>
              {userData.email}
            </div>
            <div style={{ color: '#6b7280' }}>
              {userData.firstName} {userData.lastName}
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: `${getRoleColor(userData.roleLevel)}20`,
                color: getRoleColor(userData.roleLevel)
              }}>
                {getRoleName(userData.roleLevel)}
              </span>
            </div>
            <div>
              <select
                value={userData.roleLevel}
                onChange={(e) => updateUserRole(userData.id, parseInt(e.target.value))}
                disabled={saving === userData.id}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  cursor: saving === userData.id ? 'not-allowed' : 'pointer'
                }}
              >
                <option value={1}>User (1)</option>
                <option value={2}>Admin (2)</option>
                <option value={99}>Owner (99)</option>
                <option value={100}>Super-User (100)</option>
              </select>
            </div>
            <div>
              {saving === userData.id ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  Saving...
                </div>
              ) : (
                <span style={{
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Ready
                </span>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No users found
          </div>
        )}
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '0.5rem'
        }}>
          Testing Setup Information
        </h3>
        <div style={{ color: '#0c4a6e', fontSize: '0.875rem', lineHeight: '1.5' }}>
          <p><strong>Super-User (100):</strong> Full system access, company management, role changes</p>
          <p><strong>Owner (99):</strong> Company setup, AI models, API keys, model fusion</p>
          <p><strong>Admin (2):</strong> User management, security settings, activity management</p>
          <p><strong>User (1):</strong> Chat interface access only</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}