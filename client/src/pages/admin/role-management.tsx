import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button-standard";
import { useToast } from "@/hooks/use-toast";
import { hasAccessLevel } from "@/utils/roleBasedAccess";
import { UserCog, Save, RefreshCw, Users, Shield, Plus, Edit, Trash2, Mail } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
  roleLevel: number;
  companyId?: number;
  isTrialUser?: boolean;
  department?: string;
  status: string;
  totalSessions: number;
  lastActive: string | Date;
  profileImageUrl?: string;
}

export default function RoleManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    roleLevel: 1,
    department: ''
  });

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
    if (roleLevel >= 98) return 'Administrator';
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

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const administrators = users.filter(u => u.roleLevel >= 98).length;
  const totalSessions = users.reduce((sum, u) => sum + (u.totalSessions || 0), 0);

  const createUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowCreateDialog(false);
        setFormData({ email: '', firstName: '', lastName: '', role: 'user', roleLevel: 1, department: '' });
        toast({ title: "Success", description: "User created successfully" });
      } else {
        toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    }
  };

  const editUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowEditDialog(false);
        setSelectedUser(null);
        toast({ title: "Success", description: "User updated successfully" });
      } else {
        toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowDeleteDialog(false);
        setSelectedUser(null);
        toast({ title: "Success", description: "User deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="User Management" subtitle="Manage user accounts, roles, and permissions">
      {/* Statistics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#dbeafe',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{totalUsers}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Total Users</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#dcfce7',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '24px', height: '24px', color: '#22c55e' }} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{activeUsers}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Active Users</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fed7aa',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCog style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{administrators}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Administrators</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #e9d5ff',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#f3e8ff',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{totalSessions}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Total Sessions</div>
          </div>
        </div>
      </div>

      {/* Header with Create Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>All Users</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Manage user accounts and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            onClick={fetchUsers}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Invite User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr 1fr 150px',
          gap: '16px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontWeight: '600',
          color: '#1e293b',
          fontSize: '14px'
        }}>
          <div>Email</div>
          <div>Name</div>
          <div>Current Role</div>
          <div>Role Level</div>
          <div>Actions</div>
        </div>

        {users.map((userData) => {
          const displayName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A';
          const sessionCount = userData.totalSessions || 0;
          
          return (
            <div key={userData.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 150px',
              gap: '16px',
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                  {userData.email}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {sessionCount} sessions
                </div>
              </div>
              
              <div style={{ color: '#475569' }}>
                {displayName}
              </div>
              
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
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
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: saving === userData.id ? 'not-allowed' : 'pointer',
                    width: '100%'
                  }}
                >
                  <option value={1}>User (1)</option>
                  <option value={2}>Admin (2)</option>
                  <option value={98}>Admin (98)</option>
                  <option value={99}>Owner (99)</option>
                  <option value={100}>Super-User (100)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {saving === userData.id ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedUser(userData);
                        setFormData({
                          email: userData.email,
                          firstName: userData.firstName || '',
                          lastName: userData.lastName || '',
                          role: userData.role,
                          roleLevel: userData.roleLevel,
                          department: userData.department || ''
                        });
                        setShowEditDialog(true);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Edit user"
                    >
                      <Edit style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(userData);
                        setShowDeleteDialog(true);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete user"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

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

      {/* Create User Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '480px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
              Invite New User
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="user@example.com"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Role
                </label>
                <select
                  value={formData.roleLevel}
                  onChange={(e) => setFormData({ ...formData, roleLevel: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={1}>User (1)</option>
                  <option value={2}>Admin (2)</option>
                  <option value={98}>Admin (98)</option>
                  <option value={99}>Owner (99)</option>
                  <option value={100}>Super-User (100)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Engineering"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button
                onClick={() => setShowCreateDialog(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createUser}
                style={{
                  flex: 1,
                  backgroundColor: '#3b82f6',
                  color: 'white'
                }}
              >
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {showEditDialog && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '480px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
              Edit User: {selectedUser.email}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Role
                </label>
                <select
                  value={formData.roleLevel}
                  onChange={(e) => setFormData({ ...formData, roleLevel: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={1}>User (1)</option>
                  <option value={2}>Admin (2)</option>
                  <option value={98}>Admin (98)</option>
                  <option value={99}>Owner (99)</option>
                  <option value={100}>Super-User (100)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedUser(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editUser}
                style={{
                  flex: 1,
                  backgroundColor: '#3b82f6',
                  color: 'white'
                }}
              >
                Update User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      {showDeleteDialog && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                Delete User
              </h3>
            </div>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{selectedUser.email}</strong>? 
              This action cannot be undone and will permanently remove the user and all their data.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedUser(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={deleteUser}
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: 'white'
                }}
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}