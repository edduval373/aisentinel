
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { hasAccessLevel, canViewAdminPage, ACCESS_REQUIREMENTS } from "@/utils/roleBasedAccess";
import { isDemoModeActive, isReadOnlyMode, getDemoModeMessage } from "@/utils/demoMode";

import DemoBanner from "@/components/DemoBanner";
import { Shield, Users, Settings, Edit, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useDemoDialog } from "@/hooks/useDemoDialog";
import DemoInfoDialog from "@/components/demo/DemoInfoDialog";

interface CompanyRole {
  id: number;
  companyId: number;
  name: string;
  level: number;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminRoles() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Check if user has administrator level access (98 or above) OR is in demo mode
  const hasAdminAccess = canViewAdminPage(user, ACCESS_REQUIREMENTS.USER_MANAGEMENT);
  
  // Check if we're in demo mode
  const isDemoMode = isDemoModeActive(user);
  const isReadOnly = isReadOnlyMode(user);
  
  // Demo dialog hook
  const { showDemoDialog, hideDemoDialog, isDemoDialogOpen } = useDemoDialog();
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    level: '',
    description: '',
    permissions: [] as string[]
  });
  const [editRole, setEditRole] = useState({
    name: '',
    level: '',
    description: '',
    permissions: [] as string[]
  });
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CompanyRole | null>(null);

  const availablePermissions = [
    'full_system_access',
    'manage_companies',
    'manage_company',
    'manage_users',
    'manage_roles',
    'manage_settings',
    'manage_content',
    'manage_ai_models',
    'manage_activity_types',
    'view_analytics',
    'view_all_data',
    'view_personal_data',
    'use_chat',
    'use_ai_models'
  ];

  useEffect(() => {
    if (!isLoading && hasAdminAccess) {
      fetchRoles();
    }
  }, [isLoading, hasAdminAccess, user]);

  const fetchRoles = async () => {
    try {
      // Use demo-compatible endpoint
      const endpoint = isDemoMode ? '/api/roles' : `/api/company/roles/${user?.companyId || 1}`;
      console.log("Fetching roles for company:", user?.companyId || 1);
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      });
      
      console.log("Roles API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Roles data received:", data);
        // Sort by level in descending order (1000 → 0)
        const sortedRoles = data.sort((a: CompanyRole, b: CompanyRole) => b.level - a.level);
        setRoles(sortedRoles);
      } else {
        const errorText = await response.text();
        console.error("API error:", response.status, errorText);
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (level: number) => {
    if (level === 1000) return "#dc2626"; // Super-user (Red)
    if (level === 999) return "#8b5cf6"; // Owner (Purple)
    if (level === 998) return "#3b82f6"; // Administrator (Blue)
    if (level === 1) return "#10b981"; // User (Green)
    if (level === 0) return "#f59e0b"; // Demo (Orange)
    return "#6b7280"; // Custom levels (Gray)
  };

  const getRoleDisplayName = (level: number) => {
    if (level === 1000) return "Super User";
    if (level === 999) return "Owner";
    if (level === 998) return "Administrator";
    if (level === 1) return "User";
    if (level === 0) return "Demo";
    return "Custom Role";
  };

  const createRole = async () => {
    try {
      const roleData = {
        ...newRole,
        level: parseInt(newRole.level),
        permissions: newRole.permissions
      };

      // Use demo-compatible endpoint
      const endpoint = isDemoMode ? '/api/roles' : `/api/company/roles/${user?.companyId || 1}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewRole({ name: '', level: '', description: '', permissions: [] });
        fetchRoles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setNewRole(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleEditPermissionChange = (permission: string, checked: boolean) => {
    setEditRole(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const openEditDialog = (role: CompanyRole) => {
    setEditingRole(role);
    setEditRole({
      name: role.name,
      level: role.level.toString(),
      description: role.description,
      permissions: role.permissions || []
    });
    setIsEditDialogOpen(true);
  };

  const updateRole = async () => {
    if (!editingRole) return;

    try {
      const roleData = {
        ...editRole,
        level: parseInt(editRole.level),
        permissions: editRole.permissions
      };

      // Use demo-compatible endpoint
      const endpoint = isDemoMode ? `/api/roles/${editingRole.id}` : `/api/company/roles/${editingRole.id}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingRole(null);
        setEditRole({ name: '', level: '', description: '', permissions: [] });
        fetchRoles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (role: CompanyRole) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;

    try {
      // Use demo-compatible endpoint
      const endpoint = isDemoMode ? `/api/roles/${roleToDelete.id}` : `/api/company/roles/${roleToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        fetchRoles();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <AdminLayout title="Roles & Permissions" subtitle="Manage user roles and access permissions">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <img 
            src="/ai-sentinel-logo.png" 
            alt="AI Sentinel" 
            style={{ 
              width: '64px', 
              height: '64px',
              animation: 'spin 2s linear infinite',
              filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
            }} 
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading roles and permissions...</p>
        </div>
      </AdminLayout>
    );
  }

  // Return access denied if not authenticated or lacks access
  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <AdminLayout title="Roles & Permissions" subtitle="Manage user roles and access permissions">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '256px',
          gap: '16px'
        }}>
          <Shield style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Access Denied
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Administrator access required (level 98+)
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Roles & Permissions" 
      subtitle="Manage user roles and access permissions"
      rightContent={isDemoMode && <DemoBanner message="Demo Mode - Read Only View" />}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Roles Grid */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Company Roles</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Manage role hierarchy and permissions</p>
            </div>
            {hasAdminAccess && (
              <button
                onClick={() => isDemoMode ? showDemoDialog('role-create') : setIsCreateDialogOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <Plus size={16} />
                Add Role
              </button>
            )}
          </div>
          
          <div style={{ padding: '20px' }}>
            {roles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Shield size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>No roles found</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>Create your first company role to get started</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {roles.map((role) => (
                  <div key={role.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={20} style={{ color: '#3b82f6' }} />
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{role.name}</h4>
                      </div>
                      {hasAdminAccess && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => isDemoMode ? showDemoDialog('role-edit') : openEditDialog(role)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              color: '#6b7280',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.color = '#374151';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => isDemoMode ? showDemoDialog('role-delete') : openDeleteDialog(role)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                              e.currentTarget.style.borderColor = '#f87171';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.borderColor = '#fca5a5';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>{role.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={16} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Level {role.level}</span>
                      </div>
                      <span style={{
                        backgroundColor: getRoleBadgeColor(role.level),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        {getRoleDisplayName(role.level)}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Permissions:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((permission, index) => (
                            <span key={index} style={{
                              fontSize: '11px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              padding: '2px 6px'
                            }}>
                              {permission.replace(/_/g, ' ')}
                            </span>
                          ))
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            padding: '2px 6px'
                          }}>
                            No permissions set
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permission Categories */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Permission Categories</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Available permission categories for role assignment</p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>User Management</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Create, edit, and delete users</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Assign roles to users</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• View user activity logs</div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>AI Model Management</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Configure AI models</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Enable/disable models</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Set model parameters</div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Content & Security</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Manage content policies</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Configure security settings</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Review flagged content</div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>System Settings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Configure API settings</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Manage system preferences</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>• Access audit logs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Role Modal */}
        {isCreateDialogOpen && (
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
              width: '100%',
              maxWidth: '600px',
              margin: '16px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Plus size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Create New Role</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Manager, Team Lead"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role Level *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500 (between 2-997 for custom roles)"
                    value={newRole.level}
                    onChange={(e) => setNewRole(prev => ({ ...prev, level: e.target.value }))}
                    min="2"
                    max="997"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    1000: Super User, 999: Owner, 998: Administrator, 1: User, 0: Demo. Use values 2-997 for custom roles.
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this role's responsibilities"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Permissions
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    {availablePermissions.map((permission) => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(permission)}
                          onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          style={{ margin: 0 }}
                        />
                        {permission.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  style={{
                    padding: '12px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createRole}
                  disabled={!newRole.name || !newRole.level}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: (!newRole.name || !newRole.level) ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!newRole.name || !newRole.level) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {isEditDialogOpen && editingRole && (
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
              width: '100%',
              maxWidth: '600px',
              margin: '16px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Edit size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Edit Role</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Manager, Team Lead"
                    value={editRole.name}
                    onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role Level *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500 (between 2-997 for custom roles)"
                    value={editRole.level}
                    onChange={(e) => setEditRole(prev => ({ ...prev, level: e.target.value }))}
                    min="2"
                    max="997"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    1000: Super User, 999: Owner, 998: Administrator, 1: User, 0: Demo. Use values 2-997 for custom roles.
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Describe this role's responsibilities"
                    value={editRole.description}
                    onChange={(e) => setEditRole(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Permissions
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    {availablePermissions.map((permission) => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editRole.permissions.includes(permission)}
                          onChange={(e) => handleEditPermissionChange(permission, e.target.checked)}
                          style={{ margin: 0 }}
                        />
                        {permission.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  style={{
                    padding: '12px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={updateRole}
                  disabled={!editRole.name || !editRole.level}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: (!editRole.name || !editRole.level) ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!editRole.name || !editRole.level) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteDialogOpen && roleToDelete && (
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
              width: '100%',
              maxWidth: '400px',
              margin: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <AlertTriangle size={20} style={{ color: '#dc2626' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Delete Role</h3>
              </div>
              
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                Are you sure you want to delete the role <strong>{roleToDelete.name}</strong>? This action cannot be undone and users with this role will lose their permissions.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  style={{
                    padding: '12px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteRole}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Dialog */}
        <DemoInfoDialog 
          isOpen={isDemoDialogOpen} 
          onClose={hideDemoDialog}
          feature="Role Management"
          description="View and manage company role hierarchies with sophisticated permission systems. Create custom roles with specific access levels, assign granular permissions, and maintain secure role-based access control across your organization."
          capabilities={[
            "Create custom company roles with hierarchy levels",
            "Assign granular permissions for different system features", 
            "Manage role-based access control with security levels",
            "Configure role descriptions and capability matrices",
            "Monitor role assignments and permission inheritance"
          ]}
        />
      </div>
    </AdminLayout>
  );
}

// Helper function for role badge styling
const getRoleBadgeStyle = (level: number) => {
  if (level >= 100) return { backgroundColor: '#dc2626', color: 'white' }; // Super-user
  if (level >= 99) return { backgroundColor: '#7c3aed', color: 'white' }; // Owner
  if (level >= 98) return { backgroundColor: '#ea580c', color: 'white' }; // Admin
  return { backgroundColor: '#e5e7eb', color: '#374151' }; // User
};
