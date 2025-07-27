import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Activity, Settings, Plus, Shield, Edit, Trash2, X } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ActivityType } from "@shared/schema";
import { roleBasedAccess } from "@/lib/roleBasedAccess";
import { isDemoModeActive } from "@/utils/demoMode";
import { useDemoDialog } from "@/hooks/useDemoDialog";

const activityTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  prePrompt: z.string().min(1, "Pre-prompt is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

export default function AdminActivityTypes() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<ActivityType | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Demo mode detection
  const isDemoMode = isDemoModeActive(user);
  const { showDialog, closeDialog, DialogComponent } = useDemoDialog();

  const openDialog = (type: string) => {
    const dialogConfig = {
      title: "Activity Types Management",
      description: "Comprehensive management of AI activity types with role-based permissions and security controls.",
      features: [
        "Create custom activity types with specific AI prompts and behaviors",
        "Configure risk levels (low, medium, high) for security compliance",
        "Set granular permissions for different user roles and access levels",
        "Edit existing activity types with validation and audit logging",
        "Delete unused activity types with confirmation safeguards",
        "Real-time activity monitoring and usage analytics"
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
      <AdminLayout title="Activity Types" subtitle="Manage allowed activities and their permissions">
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

  // Fetch activity types from database - use demo endpoint for demo users
  const apiEndpoint = isDemoMode ? '/api/activity-types' : '/api/admin/activity-types';
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: [apiEndpoint],
    enabled: !isLoading,
  });

  // Create activity type mutation
  const createActivityTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof activityTypeSchema>) => {
      if (isDemoMode) {
        throw new Error("Demo mode - functionality disabled");
      }
      return apiRequest('/api/admin/activity-types', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type created successfully",
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
      console.error("Create activity type error:", error);
      toast({
        title: "Error",
        description: "Failed to create activity type",
        variant: "destructive",
      });
    },
  });

  // Toggle activity type enabled status
  const toggleActivityTypeMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      if (isDemoMode) {
        throw new Error("Demo mode - functionality disabled");
      }
      return apiRequest(`/api/admin/activity-types/${id}`, 'PATCH', { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type updated successfully",
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
        description: "Failed to update activity type",
        variant: "destructive",
      });
    },
  });

  // Update activity type mutation
  const updateActivityTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof activityTypeSchema> }) => {
      if (isDemoMode) {
        throw new Error("Demo mode - functionality disabled");
      }
      return apiRequest(`/api/admin/activity-types/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type updated successfully",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingActivity(null);
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
        description: "Failed to update activity type",
        variant: "destructive",
      });
    },
  });

  // Delete activity type mutation
  const deleteActivityTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      if (isDemoMode) {
        throw new Error("Demo mode - functionality disabled");
      }
      return apiRequest(`/api/admin/activity-types/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
      toast({
        title: "Success",
        description: "Activity type deleted successfully",
      });
      setIsDeleteConfirmOpen(false);
      setActivityToDelete(null);
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
        description: "Failed to delete activity type",
        variant: "destructive",
      });
    },
  });

  // Form setup for adding new activity types
  const form = useForm<z.infer<typeof activityTypeSchema>>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      prePrompt: "",
      riskLevel: "low",
      permissions: ["read"],
    },
  });

  // Form setup for editing activity types
  const editForm = useForm<z.infer<typeof activityTypeSchema>>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      prePrompt: "",
      riskLevel: "low",
      permissions: ["read"],
    },
  });

  const onSubmit = (data: z.infer<typeof activityTypeSchema>) => {
    console.log("Form data being submitted:", data);
    createActivityTypeMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof activityTypeSchema>) => {
    if (editingActivity) {
      updateActivityTypeMutation.mutate({ id: editingActivity.id, data });
    }
  };

  const handleEdit = (activity: ActivityType) => {
    setEditingActivity(activity);
    editForm.reset({
      name: activity.name,
      description: activity.description || "",
      prePrompt: activity.prePrompt || "",
      riskLevel: (activity.riskLevel as "low" | "medium" | "high") || "low",
      permissions: Array.isArray(activity.permissions) ? activity.permissions : ["read"],
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (activity: ActivityType) => {
    setActivityToDelete(activity);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      deleteActivityTypeMutation.mutate(activityToDelete.id);
    }
  };

  if (isLoading || typesLoading) {
    return (
      <AdminLayout title="Activity Types" subtitle="Manage allowed activities and their permissions">
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
            Loading activity types...
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

  const getRiskBadgeStyle = (risk: string) => {
    switch (risk) {
      case "low": return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case "medium": return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fed7aa' };
      case "high": return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const handleToggleEnabled = (id: number, currentEnabled: boolean) => {
    toggleActivityTypeMutation.mutate({ id, isEnabled: !currentEnabled });
  };

  // Custom Switch Component
  const CustomSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: '24px',
        width: '44px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: checked ? '#3b82f6' : '#d1d5db',
        transition: 'background-color 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          height: '20px',
          width: '20px',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      />
    </button>
  );

  // Form Component
  const FormField = ({ children, error }: { children: React.ReactNode; error?: string }) => (
    <div style={{ marginBottom: '20px' }}>
      {children}
      {error && (
        <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <AdminLayout 
      title="Activity Types" 
      subtitle="Manage allowed activities and their permissions"
      rightContent={hasReadOnlyAccess ? <DemoBanner message="Demo Mode - Read Only View - Activity types cannot be modified" /> : undefined}
    >
      <div style={{ padding: '24px' }}>
        
        {/* Add Activity Type Button */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={isDemoMode ? () => openDialog('create') : () => setIsAddDialogOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isDemoMode ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: isDemoMode ? 0.6 : 1,
            }}
            onMouseOver={(e) => !isDemoMode && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !isDemoMode && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Activity Type
          </button>
        </div>

        {/* Activity Types Grid */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {activityTypes && Array.isArray(activityTypes) && activityTypes.map((activity) => (
            <div
              key={activity.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)')}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                  <Activity style={{ width: '24px', height: '24px', color: '#3b82f6', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      margin: '0 0 4px 0' 
                    }}>
                      {activity.name}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      {activity.description}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      ...getRiskBadgeStyle(activity.riskLevel || "low"),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize',
                    }}
                  >
                    {activity.riskLevel || "low"} risk
                  </span>
                  <CustomSwitch
                    checked={activity.isEnabled}
                    onChange={isDemoMode ? () => openDialog('toggle') : () => handleToggleEnabled(activity.id, activity.isEnabled)}
                    disabled={toggleActivityTypeMutation.isPending || isDemoMode}
                  />
                </div>
              </div>

              {/* Content Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#111827', 
                    marginBottom: '8px' 
                  }}>
                    Permissions
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {activity.permissions && Array.isArray(activity.permissions) ? 
                      activity.permissions.map((perm) => (
                        <span
                          key={perm}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          {perm}
                        </span>
                      )) : (
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          read
                        </span>
                      )
                    }
                  </div>
                </div>
                
                <div>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#111827', 
                    marginBottom: '8px' 
                  }}>
                    Status
                  </p>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: activity.isEnabled ? '#dcfce7' : '#f3f4f6',
                      color: activity.isEnabled ? '#166534' : '#6b7280',
                      border: activity.isEnabled ? '1px solid #bbf7d0' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {activity.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
              
              {/* Pre-prompt */}
              {activity.prePrompt && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#111827', 
                    marginBottom: '8px' 
                  }}>
                    Pre-prompt
                  </p>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: '1.5',
                  }}>
                    {activity.prePrompt}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={isDemoMode ? () => openDialog('edit') : () => handleEdit(activity)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDemoMode ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDemoMode ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isDemoMode) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDemoMode) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = '#3b82f6';
                    }
                  }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} />
                  Edit
                </button>
                
                <button
                  onClick={isDemoMode ? () => openDialog('delete') : () => handleDelete(activity)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDemoMode ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDemoMode ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isDemoMode) {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDemoMode) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = '#ef4444';
                    }
                  }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* No activity types message */}
          {(!activityTypes || !Array.isArray(activityTypes) || activityTypes.length === 0) && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <Activity style={{ 
                width: '48px', 
                height: '48px', 
                color: '#9ca3af', 
                margin: '0 auto 16px auto' 
              }} />
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280', 
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                No activity types configured yet.
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#9ca3af', 
                margin: '0'
              }}>
                Add activity types to define what actions users can perform.
              </p>
            </div>
          )}
        </div>

        {/* Add Activity Type Modal */}
        {isAddDialogOpen && (
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
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Add New Activity Type
                </h2>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#6b7280',
                  }}
                >
                  <X style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField error={form.formState.errors.name?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Name
                  </label>
                  <input
                    {...form.register('name')}
                    placeholder="e.g., Code Review"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                    }}
                  />
                </FormField>
                
                <FormField error={form.formState.errors.description?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    {...form.register('description')}
                    placeholder="Brief description of this activity type"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      resize: 'vertical',
                    }}
                  />
                </FormField>
                
                <FormField error={form.formState.errors.prePrompt?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Pre-prompt
                  </label>
                  <textarea
                    {...form.register('prePrompt')}
                    placeholder="System prompt to guide AI behavior for this activity type"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      resize: 'vertical',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    This prompt will be automatically prepended to all messages in this activity type to guide the AI's behavior.
                  </p>
                </FormField>
                
                <FormField error={form.formState.errors.riskLevel?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Risk Level
                  </label>
                  <select
                    {...form.register('riskLevel')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </FormField>
                
                <FormField error={form.formState.errors.permissions?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Permissions
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {["read", "write", "analyze", "edit", "audit"].map((permission) => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.watch('permissions')?.includes(permission) || false}
                          onChange={(e) => {
                            const currentPermissions = form.getValues('permissions') || [];
                            if (e.target.checked) {
                              form.setValue('permissions', [...currentPermissions, permission]);
                            } else {
                              form.setValue('permissions', currentPermissions.filter(p => p !== permission));
                            }
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#3b82f6',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                          {permission}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddDialogOpen(false)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createActivityTypeMutation.isPending}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: createActivityTypeMutation.isPending ? '#9ca3af' : '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: createActivityTypeMutation.isPending ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {createActivityTypeMutation.isPending ? "Creating..." : "Create Activity Type"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Activity Type Modal */}
        {isEditDialogOpen && editingActivity && (
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
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Edit Activity Type
                </h2>
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingActivity(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#6b7280',
                  }}
                >
                  <X style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                <FormField error={editForm.formState.errors.name?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Name
                  </label>
                  <input
                    {...editForm.register('name')}
                    placeholder="e.g., Code Review"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                    }}
                  />
                </FormField>
                
                <FormField error={editForm.formState.errors.description?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    {...editForm.register('description')}
                    placeholder="Brief description of this activity type"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      resize: 'vertical',
                    }}
                  />
                </FormField>
                
                <FormField error={editForm.formState.errors.prePrompt?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Pre-prompt
                  </label>
                  <textarea
                    {...editForm.register('prePrompt')}
                    placeholder="System prompt to guide AI behavior for this activity type"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      resize: 'vertical',
                    }}
                  />
                </FormField>
                
                <FormField error={editForm.formState.errors.riskLevel?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Risk Level
                  </label>
                  <select
                    {...editForm.register('riskLevel')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#111827',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </FormField>
                
                <FormField error={editForm.formState.errors.permissions?.message}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Permissions
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {["read", "write", "analyze", "edit", "audit"].map((permission) => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editForm.watch('permissions')?.includes(permission) || false}
                          onChange={(e) => {
                            const currentPermissions = editForm.getValues('permissions') || [];
                            if (e.target.checked) {
                              editForm.setValue('permissions', [...currentPermissions, permission]);
                            } else {
                              editForm.setValue('permissions', currentPermissions.filter(p => p !== permission));
                            }
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#3b82f6',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                          {permission}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingActivity(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateActivityTypeMutation.isPending}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: updateActivityTypeMutation.isPending ? '#9ca3af' : '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: updateActivityTypeMutation.isPending ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {updateActivityTypeMutation.isPending ? "Updating..." : "Update Activity Type"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && activityToDelete && (
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
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Trash2 style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Delete Activity Type
                </h2>
              </div>
              
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to delete "{activityToDelete.name}"? This action cannot be undone, and all associated data will be permanently removed.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setActivityToDelete(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteActivityTypeMutation.isPending}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: deleteActivityTypeMutation.isPending ? '#9ca3af' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: deleteActivityTypeMutation.isPending ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {deleteActivityTypeMutation.isPending ? "Deleting..." : "Delete Activity Type"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isDemoMode && DialogComponent && <DialogComponent />}
    </AdminLayout>
  );
}

