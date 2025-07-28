import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Settings, Save, Edit, UserPlus, X, Monitor, Crop, Upload } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import DemoBanner from "@/components/DemoBanner";
import { useDemoDialog, DEMO_DIALOGS } from "@/hooks/useDemoDialog";

interface Company {
  id: number;
  name: string;
  domain: string;
  primaryAdminName: string;
  primaryAdminEmail: string;
  primaryAdminTitle: string;
  logo?: string;
  logoSize?: number;
  companyNameSize?: number;
  showCompanyName?: boolean;
  showCompanyLogo?: boolean;
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
  const { showDialog, DialogComponent } = useDemoDialog();
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", department: "" });
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ name: "", domain: "", primaryAdminName: "", primaryAdminEmail: "", primaryAdminTitle: "" });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);
  
  // Fetch current user's company information
  const { data: currentCompany, isLoading: companyLoading, refetch: refetchCompany } = useQuery<Company>({
    queryKey: ["/api/user/current-company"],
    enabled: !!user?.companyId,
  });

  // Chat display preview settings
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [logoSize, setLogoSize] = useState(100);
  const [companyNameSize, setCompanyNameSize] = useState(28);
  
  // Cropping tool state
  const [isCroppingModalOpen, setIsCroppingModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [cropData, setCropData] = useState({
    x: 30,
    y: 100,
    width: 400,
    height: 150
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Load settings from current company data with proper constraints
  useEffect(() => {
    if (currentCompany) {
      setShowCompanyName(currentCompany.showCompanyName === true);
      setShowCompanyLogo(currentCompany.showCompanyLogo !== false);
      // Enforce constraints when loading from database
      setLogoSize(Math.min(Math.max(currentCompany.logoSize || 80, 60), 200));
      setCompanyNameSize(Math.min(Math.max(currentCompany.companyNameSize || 18, 14), 24));
    }
  }, [currentCompany]);

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

  // Save chat display settings to database
  const saveChatDisplaySettings = async () => {
    if (!currentCompany) return;
    
    try {
      const settings = {
        logoSize,
        companyNameSize,
        showCompanyName,
        showCompanyLogo
      };
      
      console.log("💾 Saving chat display settings to database:", settings);
      
      const response = await fetch(`/api/company/${currentCompany.id}/display-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }
      
      toast({ 
        title: "Success", 
        description: "Display settings saved to company profile" 
      });
      
      // Refresh company data to get updated settings
      refetchCompany();
      
      // Also invalidate the query cache to update all components using company data
      queryClient.invalidateQueries({ queryKey: ['/api/user/current-company'] });
      
    } catch (error) {
      console.error("Error saving display settings:", error);
      toast({ 
        title: "Error", 
        description: (error as any)?.message || "Failed to save display settings", 
        variant: "destructive" 
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        
        // Load image to get natural dimensions
        const img = new Image();
        img.onload = () => {
          setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          
          // Calculate display size (max 400px width/height)
          const maxSize = 400;
          const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
          const displayWidth = img.naturalWidth * ratio;
          const displayHeight = img.naturalHeight * ratio;
          
          setImageDisplaySize({ width: displayWidth, height: displayHeight });
          
          // Set initial crop area as a tight banner around the text
          const cropWidth = Math.min(displayWidth * 0.85, displayWidth - 20);  
          const cropHeight = Math.min(displayHeight * 0.35, displayHeight * 0.4); 
          setCropData({
            x: Math.max(10, (displayWidth - cropWidth) / 2),
            y: Math.max(10, (displayHeight - cropHeight) / 2),
            width: cropWidth,
            height: cropHeight
          });
        };
        img.src = result;
        setIsCroppingModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    if (!selectedImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate scale factor from display size to natural size
      const scaleX = imageNaturalSize.width / imageDisplaySize.width;
      const scaleY = imageNaturalSize.height / imageDisplaySize.height;
      
      // Apply scale to crop coordinates
      const naturalCropX = cropData.x * scaleX;
      const naturalCropY = cropData.y * scaleY;
      const naturalCropWidth = cropData.width * scaleX;
      const naturalCropHeight = cropData.height * scaleY;
      
      canvas.width = naturalCropWidth;
      canvas.height = naturalCropHeight;
      
      ctx?.drawImage(
        img,
        naturalCropX, naturalCropY, naturalCropWidth, naturalCropHeight,
        0, 0, naturalCropWidth, naturalCropHeight
      );
      
      // Compress image to reduce file size - use JPEG with high quality for better compression
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Update company logo directly via API
      if (currentCompany) {
        updateCompanyLogoMutation.mutate({
          id: currentCompany.id,
          logo: croppedDataUrl
        });
      }
      
      setIsCroppingModalOpen(false);
      setSelectedImage(null);
    };
    
    img.src = selectedImage;
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStart({ x, y });
    
    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle || null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(imageDisplaySize.width - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(imageDisplaySize.height - prev.height, prev.y + deltaY))
      }));
      
      setDragStart({ x, y });
    } else if (isResizing && resizeHandle) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setCropData(prev => {
        let newCrop = { ...prev };
        
        if (resizeHandle.includes('right')) {
          newCrop.width = Math.max(30, Math.min(imageDisplaySize.width - prev.x, prev.width + deltaX));
        }
        if (resizeHandle.includes('left')) {
          const newWidth = Math.max(30, prev.width - deltaX);
          const deltaWidth = prev.width - newWidth;
          newCrop.x = Math.max(0, Math.min(imageDisplaySize.width - newWidth, prev.x + deltaWidth));
          newCrop.width = newWidth;
        }
        if (resizeHandle.includes('bottom')) {
          newCrop.height = Math.max(20, Math.min(imageDisplaySize.height - prev.y, prev.height + deltaY));
        }
        if (resizeHandle.includes('top')) {
          const newHeight = Math.max(20, prev.height - deltaY);
          const deltaHeight = prev.height - newHeight;
          newCrop.y = Math.max(0, Math.min(imageDisplaySize.height - newHeight, prev.y + deltaHeight));
          newCrop.height = newHeight;
        }
        
        return newCrop;
      });
      
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
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

  const handleConfirmDelete = () => {
    if (ownerToDelete) {
      removeOwnerMutation.mutate(ownerToDelete.id);
    }
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

  // Update company logo mutation
  const updateCompanyLogoMutation = useMutation({
    mutationFn: ({ id, logo }: { id: number; logo: string }) =>
      apiRequest(`/api/admin/companies/${id}`, "PATCH", { logo }),
    onSuccess: () => {
      // Refresh company data and chat display settings
      refetchCompany();
      queryClient.invalidateQueries({ queryKey: ["/api/user/current-company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/owners"] });
      toast({ title: "Success", description: "Logo updated successfully" });
      
      // Force a reload to ensure the new logo displays in the chat header
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update logo", 
        variant: "destructive" 
      });
    },
  });

  // Update company information mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/admin/companies/${id}`, "PATCH", data),
    onSuccess: () => {
      refetchCompany();
      queryClient.invalidateQueries({ queryKey: ["/api/user/current-company"] });
      toast({ title: "Success", description: "Company information updated successfully" });
      setIsEditCompanyModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update company information", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveCompanyEdit = () => {
    if (companyEditForm.name && companyEditForm.domain && currentCompany) {
      updateCompanyMutation.mutate({
        id: currentCompany.id,
        data: {
          name: companyEditForm.name,
          domain: companyEditForm.domain,
          primaryAdminName: companyEditForm.primaryAdminName,
          primaryAdminEmail: companyEditForm.primaryAdminEmail,
          primaryAdminTitle: companyEditForm.primaryAdminTitle
        }
      });
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
    <AdminLayout 
      title="Company Setup" 
      subtitle="Configure your current company and manage owners"
      rightContent={<DemoBanner message="Demo Mode - Read Only View - Company settings cannot be modified" />}
    >
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
            
            {/* Format Options - Single Line */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px', 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              flexWrap: 'wrap'
            }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer',
                  opacity: user?.roleLevel === 0 ? 0.6 : 1
                }}
                onClick={user?.roleLevel === 0 ? () => showDialog(DEMO_DIALOGS.COMPANY_SETUP) : undefined}
              >
                <input 
                  type="checkbox" 
                  checked={showCompanyLogo}
                  onChange={user?.roleLevel === 0 ? undefined : (e) => setShowCompanyLogo(e.target.checked)}
                  disabled={user?.roleLevel === 0}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>Show Company Logo</span>
              </label>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer',
                  opacity: user?.roleLevel === 0 ? 0.6 : 1
                }}
                onClick={user?.roleLevel === 0 ? () => showDialog(DEMO_DIALOGS.COMPANY_SETUP) : undefined}
              >
                <input 
                  type="checkbox" 
                  checked={showCompanyName}
                  onChange={user?.roleLevel === 0 ? undefined : (e) => setShowCompanyName(e.target.checked)}
                  disabled={user?.roleLevel === 0}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>Show Company Name</span>
              </label>
              <button
                onClick={user?.roleLevel === 0 ? () => showDialog(DEMO_DIALOGS.COMPANY_SETUP) : () => {
                  setShowCompanyName(true);
                  setShowCompanyLogo(true);
                  setLogoSize(80);
                  setCompanyNameSize(18);
                }}
                style={{
                  backgroundColor: user?.roleLevel === 0 ? '#9ca3af' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (user?.roleLevel !== 0) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (user?.roleLevel !== 0) {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                  }
                }}
              >
                Reset to Defaults
              </button>
              <div style={{ position: 'relative' }}>
                {user?.roleLevel === 0 ? (
                  // Demo mode - show info dialog instead of upload
                  <button
                    onClick={() => showDialog(DEMO_DIALOGS.COMPANY_SETUP)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                    Learn About Logo Upload
                  </button>
                ) : (
                  // Regular mode - functional upload
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                    >
                      <Upload style={{ width: '14px', height: '14px' }} />
                      Upload & Crop Logo
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Logo Size Control */}
            {showCompanyLogo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <label style={{ fontSize: '14px', color: '#374151', minWidth: '80px', fontWeight: '500' }}>
                  Logo Size:
                </label>
                <button
                  onClick={user?.roleLevel === 0 ? () => showDialog(DEMO_DIALOGS.COMPANY_SETUP) : () => setLogoSize(Math.max(60, logoSize - 10))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: user?.roleLevel === 0 ? '#f3f4f6' : '#ffffff',
                    color: user?.roleLevel === 0 ? '#9ca3af' : '#374151',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (user?.roleLevel !== 0) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (user?.roleLevel !== 0) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                >
                  -
                </button>
                <span style={{
                  minWidth: '80px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}>
                  {logoSize}px
                </span>
                <button
                  onClick={user?.roleLevel === 0 ? () => showDialog(DEMO_DIALOGS.COMPANY_SETUP) : () => setLogoSize(Math.min(200, logoSize + 10))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: user?.roleLevel === 0 ? '#f3f4f6' : '#ffffff',
                    color: user?.roleLevel === 0 ? '#9ca3af' : '#374151',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: user?.roleLevel === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (user?.roleLevel !== 0) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (user?.roleLevel !== 0) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                >
                  +
                </button>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  marginLeft: '8px' 
                }}>
                  (60-200px, header max: 56px)
                </span>
              </div>
            )}

            {/* Company Name Size Control */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ fontSize: '14px', color: '#374151', minWidth: '80px', fontWeight: '500' }}>
                Name Size:
              </label>
              <button
                onClick={() => setCompanyNameSize(Math.max(14, companyNameSize - 2))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                -
              </button>
              <span style={{
                minWidth: '80px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                padding: '6px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}>
                {companyNameSize}px
              </span>
              <button
                onClick={() => setCompanyNameSize(Math.min(24, companyNameSize + 2))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                +
              </button>
              <span style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                marginLeft: '8px' 
              }}>
                (14-24px, header max: 18px)
              </span>
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
                        {currentCompany?.logo ? (
                          <>
                            <img 
                              src={currentCompany.logo} 
                              alt={currentCompany.name}
                              onError={(e) => {
                                // Fallback to company initial if logo fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallbackDiv = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                if (fallbackDiv) {
                                  fallbackDiv.style.display = 'flex';
                                }
                              }}
                              style={{ 
                                maxWidth: `${logoSize}px`, 
                                maxHeight: `${logoSize}px`, 
                                height: 'auto',
                                width: 'auto',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                border: '3px solid #9ca3af',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <div 
                              className="logo-fallback"
                              style={{ 
                                width: `${logoSize}px`, 
                                height: `${logoSize}px`, 
                                backgroundColor: '#3b82f6', 
                                borderRadius: '12px',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: `${Math.floor(logoSize * 0.35)}px`,
                                fontWeight: 700,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                border: '3px solid #9ca3af'
                              }}
                            >
                              {currentCompany.name.charAt(0).toUpperCase()}
                            </div>
                          </>
                        ) : (
                          <div 
                            style={{ 
                              width: `${logoSize}px`, 
                              height: `${logoSize}px`, 
                              backgroundColor: '#3b82f6', 
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: `${Math.floor(logoSize * 0.35)}px`,
                              fontWeight: 700,
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                          fontSize: `${companyNameSize}px`, 
                          fontWeight: 700, 
                          color: '#1e293b',
                          transition: 'all 0.3s ease'
                        }}>
                          {currentCompany.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Company ID: {currentCompany.id}
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
                onClick={() => {
                  if (user?.roleLevel === 0) {
                    showDialog(DEMO_DIALOGS.COMPANY_SETUP);
                  } else {
                    saveChatDisplaySettings();
                  }
                }}
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
                      maxWidth: '48px', 
                      maxHeight: '48px', 
                      height: 'auto',
                      width: 'auto',
                      objectFit: 'contain', 
                      borderRadius: '6px', 
                      border: '2px solid #9ca3af' 
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

        {/* Logo Cropping Modal */}
        {isCroppingModalOpen && selectedImage && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Crop style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0' }}>
                  Crop Company Logo
                </h3>
              </div>
              
              <div style={{ 
                position: 'relative', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    userSelect: 'none'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img 
                    src={selectedImage} 
                    alt="Selected logo"
                    style={{ 
                      width: `${imageDisplaySize.width}px`,
                      height: `${imageDisplaySize.height}px`,
                      display: 'block',
                      borderRadius: '8px'
                    }}
                    draggable={false}
                  />
                  
                  {/* Crop Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '8px'
                  }}>
                    {/* Crop Selection Area */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${cropData.x}px`,
                        top: `${cropData.y}px`,
                        width: `${cropData.width}px`,
                        height: `${cropData.height}px`,
                        backgroundColor: 'transparent',
                        border: '2px solid #3b82f6',
                        borderRadius: '4px',
                        cursor: isDragging ? 'grabbing' : 'grab'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMouseDown(e, 'drag');
                      }}
                    >
                      {/* Resize Handles */}
                      {/* Top-left */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '-6px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: 'nw-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'top-left');
                        }}
                      />
                      
                      {/* Top-right */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: 'ne-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'top-right');
                        }}
                      />
                      
                      {/* Bottom-left */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '-6px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: 'sw-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'bottom-left');
                        }}
                      />
                      
                      {/* Bottom-right */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          right: '-6px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: 'se-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'bottom-right');
                        }}
                      />
                      
                      {/* Edge handles */}
                      {/* Top */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '16px',
                          height: '8px',
                          backgroundColor: '#3b82f6',
                          border: '1px solid white',
                          borderRadius: '4px',
                          cursor: 'n-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'top');
                        }}
                      />
                      
                      {/* Bottom */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '16px',
                          height: '8px',
                          backgroundColor: '#3b82f6',
                          border: '1px solid white',
                          borderRadius: '4px',
                          cursor: 's-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'bottom');
                        }}
                      />
                      
                      {/* Left */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-4px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '1px solid white',
                          borderRadius: '4px',
                          cursor: 'w-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'left');
                        }}
                      />
                      
                      {/* Right */}
                      <div
                        style={{
                          position: 'absolute',
                          right: '-4px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '1px solid white',
                          borderRadius: '4px',
                          cursor: 'e-resize'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, 'resize', 'right');
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '12px' }}>
                    <button
                      onClick={() => {
                        // Auto-crop to tight fit around image content
                        const margin = 15;
                        setCropData({
                          x: margin,
                          y: margin,
                          width: imageDisplaySize.width - (margin * 2),
                          height: imageDisplaySize.height - (margin * 2)
                        });
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Auto-Crop Full
                    </button>
                    <button
                      onClick={() => {
                        // Auto-crop to banner style around text area
                        const bannerHeight = imageDisplaySize.height * 0.3;
                        const bannerY = (imageDisplaySize.height - bannerHeight) / 2;
                        setCropData({
                          x: 20,
                          y: bannerY,
                          width: imageDisplaySize.width - 40,
                          height: bannerHeight
                        });
                      }}
                      style={{
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Auto-Crop Banner
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0' }}>
                    Drag to move • Use handles to resize width and height independently • Auto-crop buttons for quick selection
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => {
                    setIsCroppingModalOpen(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Crop style={{ width: '16px', height: '16px' }} />
                  Apply Crop
                </button>
              </div>
            </div>
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

        {/* Edit Company Modal */}
        {isEditCompanyModalOpen && currentCompany && (
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
              maxWidth: '600px',
              margin: '16px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                Edit Company Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyEditForm.name}
                    onChange={(e) => setCompanyEditForm({ ...companyEditForm, name: e.target.value })}
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
                    Domain *
                  </label>
                  <input
                    type="text"
                    value={companyEditForm.domain}
                    onChange={(e) => setCompanyEditForm({ ...companyEditForm, domain: e.target.value })}
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
                    Primary Admin Name
                  </label>
                  <input
                    type="text"
                    value={companyEditForm.primaryAdminName}
                    onChange={(e) => setCompanyEditForm({ ...companyEditForm, primaryAdminName: e.target.value })}
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
                    Primary Admin Email
                  </label>
                  <input
                    type="email"
                    value={companyEditForm.primaryAdminEmail}
                    onChange={(e) => setCompanyEditForm({ ...companyEditForm, primaryAdminEmail: e.target.value })}
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
                    Primary Admin Title
                  </label>
                  <input
                    type="text"
                    value={companyEditForm.primaryAdminTitle}
                    onChange={(e) => setCompanyEditForm({ ...companyEditForm, primaryAdminTitle: e.target.value })}
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
                    setIsEditCompanyModalOpen(false);
                    setCompanyEditForm({ name: "", domain: "", primaryAdminName: "", primaryAdminEmail: "", primaryAdminTitle: "" });
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
                  onClick={() => {
                    if (user?.roleLevel === 0) {
                      showDialog(DEMO_DIALOGS.COMPANY_EDIT);
                    } else {
                      handleSaveCompanyEdit();
                    }
                  }}
                  disabled={!companyEditForm.name || !companyEditForm.domain || updateCompanyMutation.isPending}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: (!companyEditForm.name || !companyEditForm.domain || updateCompanyMutation.isPending) ? 'not-allowed' : 'pointer',
                    opacity: (!companyEditForm.name || !companyEditForm.domain || updateCompanyMutation.isPending) ? '0.5' : '1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {updateCompanyMutation.isPending ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid #ffffff40', 
                        borderTop: '2px solid #ffffff', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: '16px', height: '16px' }} />
                      Update Company
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Demo Info Dialog */}
        <DialogComponent />
      </div>
    </AdminLayout>
  );
}