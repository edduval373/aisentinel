import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Settings, Save, Edit, UserPlus, X, Monitor } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

interface Company {
  id: number;
  name: string;
  domain: string;
  primaryAdminName: string;
  primaryAdminEmail: string;
  primaryAdminTitle: string;
  logo?: string;
  isActive: boolean;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
}

export default function CompanySetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", department: "" });
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ name: "", domain: "", primaryAdminName: "", primaryAdminEmail: "", primaryAdminTitle: "" });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);
  
  // Chat display preview settings
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [previewZoomed, setPreviewZoomed] = useState(false);

  // Fetch current user's company information
  const { data: currentCompany, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/user/current-company"],
    enabled: !!user?.companyId,
  });

  // Fetch owners from API
  const { data: owners = [], isLoading: ownersLoading, refetch: refetchOwners } = useQuery<Owner[]>({
    queryKey: [`/api/company/owners/${currentCompany?.id}`],
    enabled: !!currentCompany?.id,
  });

  const handleAddOwner = () => {
    setEditingOwner(null);
    setEditForm({ firstName: "", lastName: "", email: "", department: "" });
    setIsEditModalOpen(true);
  };

  // Save chat display settings
  const saveChatDisplaySettings = async () => {
    try {
      const settings = {
        showCompanyName,
        showCompanyLogo
      };
      
      // Save to localStorage for immediate use
      localStorage.setItem('chatDisplaySettings', JSON.stringify(settings));
      
      // Save to database (you can add API endpoint later)
      console.log("💾 Saving chat display settings:", settings);
      
      toast({ 
        title: "Success", 
        description: "Chat display settings saved successfully" 
      });
      
      // Trigger a page refresh to update the chat header
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Error saving chat display settings:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save chat display settings", 
        variant: "destructive" 
      });
    }
  };

  const handleEditOwner = (owner: Owner) => {
    setEditingOwner(owner);
    setEditForm({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      department: owner.department || ""
    });
    setIsEditModalOpen(true);
  };

  // Add owner mutation
  const addOwnerMutation = useMutation({
    mutationFn: (ownerData: { firstName: string; lastName: string; email: string; department?: string }) =>
      apiRequest(`/api/company/owners/${currentCompany?.id}`, "POST", ownerData),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner added successfully" });
      setIsEditModalOpen(false);
      setEditingOwner(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to add owner", 
        variant: "destructive" 
      });
    },
  });

  // Update owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: (ownerData: { userId: string; firstName?: string; lastName?: string; email?: string; department?: string }) =>
      apiRequest(`/api/company/owners/${ownerData.userId}`, "PATCH", ownerData),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner updated successfully" });
      setIsEditModalOpen(false);
      setEditingOwner(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update owner", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveEdit = () => {
    if (editForm.firstName && editForm.lastName && editForm.email) {
      if (editingOwner) {
        updateOwnerMutation.mutate({
          userId: editingOwner.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          department: editForm.department
        });
      } else {
        addOwnerMutation.mutate({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          department: editForm.department
        });
      }
    }
  };

  // Remove owner mutation
  const removeOwnerMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/company/owners/${userId}/${currentCompany?.id}`, "DELETE"),
    onSuccess: () => {
      refetchOwners();
      toast({ title: "Success", description: "Owner deleted successfully" });
      setIsDeleteConfirmOpen(false);
      setOwnerToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to remove owner", 
        variant: "destructive" 
      });
    },
  });

  const handleEditCompany = (company: Company) => {
    setCompanyEditForm({
      name: company.name,
      domain: company.domain,
      primaryAdminName: company.primaryAdminName,
      primaryAdminEmail: company.primaryAdminEmail,
      primaryAdminTitle: company.primaryAdminTitle
    });
    setIsEditCompanyModalOpen(true);
  };

  const handleSaveCompanyEdit = () => {
    if (companyEditForm.name && companyEditForm.domain) {
      toast({ title: "Success", description: "Company information updated successfully" });
      setIsEditCompanyModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (ownerToDelete) {
      removeOwnerMutation.mutate(ownerToDelete.id);
    }
  };

  if (companyLoading) {
    return (
      <AdminLayout title="Company Setup" subtitle="Configure your company settings">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
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
            Loading company settings...
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
    <AdminLayout title="Company Setup" subtitle="Configure your current company and manage owners">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Chat Screen Preview */}
        {currentCompany && (
          <div style={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Monitor style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0' }}>
                Chat Screen Preview
              </h2>
            </div>
            
            {/* Display Options */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showCompanyLogo}
                  onChange={(e) => setShowCompanyLogo(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Show Company Logo</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showCompanyName}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Show Company Name</span>
              </label>
            </div>
            
            {/* Preview Display */}
            <div style={{ 
              backgroundColor: '#f1f5f9', 
              border: '2px dashed #cbd5e1', 
              borderRadius: '8px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', fontWeight: 500 }}>
                How this will appear on chat screen:
              </p>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '24px',
                minHeight: '80px'
              }}>
                {(showCompanyLogo || showCompanyName) ? (
                  <>
                    {showCompanyLogo && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {currentCompany.logo ? (
                          <img 
                            src={currentCompany.logo} 
                            alt={currentCompany.name}
                            onClick={() => setPreviewZoomed(!previewZoomed)}
                            style={{ 
                              width: previewZoomed ? '120px' : '80px', 
                              height: previewZoomed ? '120px' : '80px', 
                              objectFit: 'contain',
                              borderRadius: '12px',
                              border: `2px solid ${previewZoomed ? '#3b82f6' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              transform: previewZoomed ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: previewZoomed ? '0 8px 25px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        ) : (
                          <div 
                            onClick={() => setPreviewZoomed(!previewZoomed)}
                            style={{ 
                              width: previewZoomed ? '120px' : '80px', 
                              height: previewZoomed ? '120px' : '80px', 
                              backgroundColor: '#3b82f6', 
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: previewZoomed ? '36px' : '28px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: previewZoomed ? '0 8px 25px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {currentCompany.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {showCompanyName && (
                      <div>
                        <div style={{ 
                          fontSize: previewZoomed ? '32px' : '28px', 
                          fontWeight: 700, 
                          color: '#1e293b',
                          transition: 'all 0.3s ease'
                        }}>
                          {currentCompany.name}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#94a3b8', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          Click logo to {previewZoomed ? 'zoom out' : 'zoom in'}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '16px', fontStyle: 'italic' }}>
                    No company branding will be displayed
                  </div>
                )}
              </div>
            </div>
            
            {/* Save Settings Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: '1px solid #e5e7eb' 
            }}>
              <button
                onClick={saveChatDisplaySettings}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                Save Chat Display Settings
              </button>
            </div>
          </div>
        )}
        
        {/* Current Company Details */}
        {currentCompany && (
          <div style={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0' }}>
                  {currentCompany.name}
                </h2>
                <span style={{ 
                  backgroundColor: '#3b82f6', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Current Company
                </span>
              </div>
              <button 
                onClick={() => handleEditCompany(currentCompany)}
                style={{
                  color: '#16a34a',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit style={{ width: '16px', height: '16px' }} />
                Edit
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {currentCompany.logo && (
                  <img 
                    src={currentCompany.logo} 
                    alt={currentCompany.name} 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      objectFit: 'cover', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb' 
                    }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                    {currentCompany.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                    {currentCompany.domain}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 4px 0' }}>
                  Primary Administrator
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  {currentCompany.primaryAdminName} - {currentCompany.primaryAdminTitle}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  {currentCompany.primaryAdminEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Company Owners Section */}
        {currentCompany && (
          <div style={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0' }}>
                  Owners ({Array.isArray(owners) ? owners.length : 0})
                </h3>
              </div>
              <button 
                onClick={handleAddOwner}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus style={{ width: '16px', height: '16px' }} />
                Add Owner
              </button>
            </div>

            {ownersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '3px solid #f3f4f6', 
                  borderTop: '3px solid #3b82f6', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
              </div>
            ) : !Array.isArray(owners) || owners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <Users style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#d1d5db' }} />
                <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>No owners yet</p>
                <p style={{ fontSize: '14px', margin: '0' }}>Add owners to manage this company</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {Array.isArray(owners) && owners.map((owner: Owner) => (
                  <div 
                    key={owner.id} 
                    style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                      <div style={{ flex: '1' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                          {owner.firstName} {owner.lastName}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 2px 0' }}>
                          {owner.email}
                        </p>
                        {owner.department && (
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                            {owner.department}
                          </p>
                        )}
                        <span style={{ 
                          backgroundColor: '#fbbf24', 
                          color: '#92400e', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {owner.role}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditOwner(owner)}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#374151'
                          }}
                        >
                          <Edit style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button 
                          onClick={() => {
                            setOwnerToDelete(owner);
                            setIsDeleteConfirmOpen(true);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#dc2626'
                          }}
                        >
                          <X style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Owner Modal */}
        {isEditModalOpen && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              margin: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                {editingOwner ? 'Edit Owner' : 'Add New Owner'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
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
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingOwner(null);
                    setEditForm({ firstName: "", lastName: "", email: "", department: "" });
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editForm.firstName || !editForm.lastName || !editForm.email}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    opacity: (!editForm.firstName || !editForm.lastName || !editForm.email) ? '0.5' : '1'
                  }}
                >
                  <Save style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                  {editingOwner ? 'Update' : 'Add'} Owner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && ownerToDelete && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              margin: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                Confirm Delete
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
                Are you sure you want to remove {ownerToDelete.firstName} {ownerToDelete.lastName} as an owner? This action cannot be undone.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setOwnerToDelete(null);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Delete Owner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}