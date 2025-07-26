import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { roleBasedAccess } from "@/lib/roleBasedAccess";
import { isDemoModeActive } from "@/utils/demoMode";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Users, Settings, Eye, FileText, Bot, Plus, Edit, Trash2, X } from "lucide-react";

// Switch component for standard CSS implementation
const Switch = ({ checked, onCheckedChange, disabled = false, id }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) => (
  <button
    id={id}
    onClick={() => !disabled && onCheckedChange(!checked)}
    disabled={disabled}
    style={{
      position: 'relative',
      display: 'inline-flex',
      width: '44px',
      height: '24px',
      padding: '0',
      backgroundColor: checked ? '#3b82f6' : '#d1d5db',
      borderRadius: '12px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s ease',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    />
  </button>
);

// Permission schema for forms
const permissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["ai_model_access", "activity_types", "content_access", "administrative"]),
  enabled: z.boolean().default(true),
});

type Permission = {
  id: number;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  createdAt: string;
};

// Helper function to check if error is unauthorized
const isUnauthorizedError = (error: any) => {
  return error?.message?.includes('401') || error?.message?.includes('Unauthorized');
};

export default function AdminPermissions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Fetch permissions data
  const { data: permissions = [], isLoading: permissionsLoading, error: permissionsError } = useQuery<Permission[]>({
    queryKey: ['/api/admin/permissions'],
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

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof permissionSchema>) => {
      return apiRequest('/api/admin/permissions', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
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

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof permissionSchema> }) => {
      return apiRequest(`/api/admin/permissions/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingPermission(null);
    },
    onError: (error) => {
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

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/permissions/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
      setIsDeleteConfirmOpen(false);
      setPermissionToDelete(null);
    },
    onError: (error) => {
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

  // Toggle permission enabled status
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest(`/api/admin/permissions/${id}`, 'PATCH', { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
    },
    onError: (error) => {
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

  // Form setup for adding new permissions
  const form = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "ai_model_access",
      enabled: true,
    },
  });

  // Form setup for editing permissions
  const editForm = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "ai_model_access",
      enabled: true,
    },
  });

  const onSubmit = (data: z.infer<typeof permissionSchema>) => {
    console.log("Form data being submitted:", data);
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

  // Check access level - allow demo users (0) read-only access and administrators (98+) full access
  const isDemoMode = isDemoModeActive(user);
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

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

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

  if (!isAuthenticated) {
    return null;
  }

  // Group permissions by category
  const groupedPermissions = (permissions as Permission[]).reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai_model_access': return Bot;
      case 'activity_types': return FileText;
      case 'content_access': return Eye;
      case 'administrative': return Shield;
      default: return Settings;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'ai_model_access': return 'AI Model Access';
      case 'activity_types': return 'Activity Types';
      case 'content_access': return 'Content Access';
      case 'administrative': return 'Administrative';
      default: return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'ai_model_access': return 'Control which AI models users can access';
      case 'activity_types': return 'Define what activities users can perform';
      case 'content_access': return 'Control what content users can access and share';
      case 'administrative': return 'Administrative privileges and system access';
      default: return 'Permission category';
    }
  };

  return (
    <AdminLayout 
      title="Permissions" 
      subtitle="Configure activity permissions and access controls"
      rightContent={isDemoMode && <DemoBanner message="Demo Mode - Read Only View" />}
    >
      <div style={{ padding: '24px' }}>
        {/* Header with Add Button - Only show for full access users */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
              Permissions Management
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Configure permissions and access controls for different user activities
            </p>
          </div>
          {hasFullAccess && (
            <button
              onClick={() => setIsAddDialogOpen(true)}
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
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
              Add Permission
            </button>
          )}
        </div>

        {/* Permission Categories Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
            const Icon = getCategoryIcon(category);
            return (
              <div
                key={category}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Icon style={{ width: '24px', height: '24px', color: '#3b82f6', marginRight: '12px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                      {getCategoryName(category)}
                    </h3>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                    {getCategoryDescription(category)}
                  </p>
                </div>

                {/* Card Content */}
                <div style={{ padding: '20px' }}>
                  {(categoryPermissions as Permission[]).length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>
                      No permissions in this category
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(categoryPermissions as Permission[]).map((permission: Permission) => (
                        <div
                          key={permission.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              fontSize: '16px', 
                              fontWeight: '500', 
                              color: '#1f2937', 
                              margin: '0 0 4px 0' 
                            }}>
                              {permission.name}
                            </h4>
                            <p style={{ 
                              fontSize: '14px', 
                              color: '#6b7280', 
                              margin: '0' 
                            }}>
                              {permission.description}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Switch
                              checked={permission.enabled}
                              onCheckedChange={(enabled) => 
                                togglePermissionMutation.mutate({ id: permission.id, enabled })
                              }
                              disabled={togglePermissionMutation.isPending || !!hasReadOnlyAccess}
                            />
                            {hasFullAccess && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleEdit(permission)}
                                  style={{
                                    padding: '8px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'background-color 0.2s',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                >
                                  <Edit style={{ width: '16px', height: '16px' }} />
                                </button>
                                <button
                                  onClick={() => handleDelete(permission)}
                                  style={{
                                    padding: '8px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'background-color 0.2s',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                                >
                                  <Trash2 style={{ width: '16px', height: '16px' }} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

