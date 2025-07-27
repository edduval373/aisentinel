import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Plus, Shield, Edit, Trash2, X } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { roleBasedAccess } from "@/lib/roleBasedAccess";
import { isDemoModeActive } from "@/utils/demoMode";
import { useDemoDialog } from "@/hooks/useDemoDialog";

interface Permission {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}

const permissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["ai_model_access", "activity_types", "content_access", "administrative"]),
  enabled: z.boolean().default(true),
});

export default function AdminPermissions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Demo mode detection
  const isDemoMode = isDemoModeActive(user);
  const { showDialog, closeDialog, DialogComponent } = useDemoDialog();

  const openDialog = (type: string) => {
    const dialogConfig = {
      title: "Permissions Management",
      description: "Comprehensive management of user permissions and access controls for AI models and features.",
      features: [
        "Create granular permissions for AI model access and feature controls",
        "Configure permission categories (AI models, activities, content, admin)",
        "Enable/disable permissions with real-time effect on user access",
        "Edit existing permissions with validation and audit tracking",
        "Delete unused permissions with confirmation safeguards",
        "Real-time permission monitoring and compliance reporting"
      ]
    };
    closeDialog();
    setTimeout(() => {
      showDialog(dialogConfig);
    }, 10);
  };

  // Check access level - require Administrator (98+) access, but allow demo users (0) read-only access
  const hasReadOnlyAccess = user && (user.roleLevel === 0); // Demo users
  const hasFullAccess = user && user.roleLevel !== undefined && roleBasedAccess.hasAccessLevel(user.roleLevel, 98); // Administrator+
  
  if (!isLoading && user && !hasReadOnlyAccess && !hasFullAccess) {
    return (
      <AdminLayout title="Permissions" subtitle="Configure activity permissions and access controls">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          textAlign: 'center',
          padding: '40px'
        }}>
          <Shield style={{ width: '64px', height: '64px', color: '#ef4444', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
            Administrator level access required (Level 98+)
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Your current access level: {user.roleLevel}
          </p>
        </div>
      </AdminLayout>
    );
  }

  // Use appropriate endpoint based on demo mode
  const apiEndpoint = isDemoMode ? '/api/permissions' : '/api/admin/permissions';

  const { data: permissions = [], isLoading: permissionsLoading, error: permissionsError } = useQuery<Permission[]>({
    queryKey: [apiEndpoint],
    enabled: !isLoading,
  });

  const form = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "ai_model_access",
      enabled: true,
    },
  });

  const editForm = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "ai_model_access", 
      enabled: true,
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof permissionSchema>) => {
      if (isDemoMode) {
        openDialog('create');
        throw new Error('Demo mode');
      }
      return apiRequest('/api/admin/permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
    },
    onError: (error: any) => {
      if (error.message === 'Demo mode') return;
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive",
      });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof permissionSchema> }) => {
      if (isDemoMode) {
        openDialog('edit');
        throw new Error('Demo mode');
      }
      return apiRequest(`/api/admin/permissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      setIsEditDialogOpen(false);
      setEditingPermission(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
    },
    onError: (error: any) => {
      if (error.message === 'Demo mode') return;
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      if (isDemoMode) {
        openDialog('delete');
        throw new Error('Demo mode');
      }
      return apiRequest(`/api/admin/permissions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      setIsDeleteConfirmOpen(false);
      setPermissionToDelete(null);
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
    },
    onError: (error: any) => {
      if (error.message === 'Demo mode') return;
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error", 
        description: "Failed to delete permission",
        variant: "destructive",
      });
    },
  });

  // Handle query errors
  useEffect(() => {
    if (permissionsError && isUnauthorizedError(permissionsError)) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [permissionsError, toast]);

  const onSubmit = (data: z.infer<typeof permissionSchema>) => {
    createPermissionMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof permissionSchema>) => {
    if (editingPermission) {
      updatePermissionMutation.mutate({ id: editingPermission.id, data });
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    editForm.reset({
      name: permission.name,
      description: permission.description || "",
      category: permission.category as "ai_model_access" | "activity_types" | "content_access" | "administrative",
      enabled: permission.enabled,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    setPermissionToDelete(permission);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (permissionToDelete) {
      deletePermissionMutation.mutate(permissionToDelete.id);
    }
  };

  if (isLoading || permissionsLoading) {
    return (
      <AdminLayout title="Permissions" subtitle="Configure activity permissions and access controls">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            animation: 'spin 2s linear infinite'
          }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="Loading..." 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
              }} 
            />
          </div>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Loading permissions...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Permissions" subtitle="Configure activity permissions and access controls">
      {hasReadOnlyAccess && <DemoBanner message="Demo Mode - Read Only View" />}
      
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0' }}>
              Permissions Management
            </h1>
          </div>
          <button
            onClick={() => isDemoMode ? openDialog('create') : setIsAddDialogOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Permission
          </button>
        </div>

        {/* Permissions Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: '20px' 
        }}>
          {permissions.map((permission) => (
            <div
              key={permission.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827', 
                    margin: '0 0 8px 0' 
                  }}>
                    {permission.name}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    margin: '0 0 12px 0',
                    lineHeight: '1.5'
                  }}>
                    {permission.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {permission.category.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: permission.enabled ? '#dcfce7' : '#fee2e2',
                      color: permission.enabled ? '#166534' : '#dc2626',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {permission.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => isDemoMode ? openDialog('edit') : handleEdit(permission)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = 'inherit';
                    }}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                  </button>
                  
                  <button
                    onClick={() => isDemoMode ? openDialog('delete') : handleDelete(permission)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = 'inherit';
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {permissions.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#6b7280' 
          }}>
            <Settings style={{ 
              width: '48px', 
              height: '48px', 
              color: '#d1d5db', 
              margin: '0 auto 16px auto',
              display: 'block'
            }} />
            <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
              No permissions found
            </h3>
            <p style={{ fontSize: '14px' }}>
              Create your first permission to get started with access control.
            </p>
          </div>
        )}
      </div>

      <DialogComponent />
    </AdminLayout>
  );
}